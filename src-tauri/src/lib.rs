use chrono::{Datelike, Local, Timelike};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, State,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_notification::NotificationExt;

const BOOK_WIDTH: f64 = 170.0;
const BOOK_HEIGHT: f64 = 170.0;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Reminder {
    id: String,
    time: String,
    days: Vec<u32>,
    enabled: bool,
}

#[derive(Clone, Serialize, Deserialize)]
struct SavedSettings {
    reminders: Vec<Reminder>,
    bounce_enabled: bool,
}

impl Default for SavedSettings {
    fn default() -> Self {
        Self {
            reminders: Vec::new(),
            bounce_enabled: true,
        }
    }
}

struct ActiveBounce {
    reminder_id: Option<String>,
    started: Instant,
}

struct Runtime {
    saved: SavedSettings,
    active: Option<ActiveBounce>,
    snooze: Option<(String, Instant)>,
    fired: HashSet<String>,
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
    bounds: (f64, f64, f64, f64),
}

impl Runtime {
    fn new(saved: SavedSettings) -> Self {
        Self {
            saved,
            active: None,
            snooze: None,
            fired: HashSet::new(),
            x: 0.0,
            y: 0.0,
            vx: 2.5,
            vy: 1.9,
            bounds: (0.0, 0.0, 1000.0, 700.0),
        }
    }
}

struct Shared(Mutex<Runtime>);

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("reminders.json"))
}

fn save_settings(app: &AppHandle, settings: &SavedSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let data = serde_json::to_vec(settings).map_err(|e| e.to_string())?;
    let temporary = path.with_extension("json.tmp");
    fs::write(&temporary, data).map_err(|e| e.to_string())?;
    fs::rename(&temporary, &path).map_err(|e| e.to_string())
}

fn load_settings(app: &AppHandle) -> SavedSettings {
    settings_path(app)
        .ok()
        .and_then(|path| fs::read(path).ok())
        .and_then(|data| serde_json::from_slice(&data).ok())
        .unwrap_or_default()
}

fn book_window(app: &AppHandle) -> Result<tauri::WebviewWindow, String> {
    app.get_webview_window("overlay")
        .ok_or_else(|| "Bible overlay is unavailable".into())
}

fn start_bounce(app: &AppHandle, reminder_id: Option<String>) -> Result<(), String> {
    let window = book_window(app)?;
    let monitor = app
        .get_webview_window("main")
        .and_then(|main| main.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No display was found".to_string())?;
    let scale = monitor.scale_factor();
    let origin = monitor.position();
    let size = monitor.size();
    let width = BOOK_WIDTH * scale;
    let height = BOOK_HEIGHT * scale;
    let (left, top) = (origin.x as f64, origin.y as f64);
    let (right, bottom) = (
        left + size.width as f64 - width,
        top + size.height as f64 - height,
    );
    let shared = app.state::<Shared>();
    let mut state = shared
        .0
        .lock()
        .map_err(|_| "Overlay state is unavailable")?;
    state.bounds = (left, top, right.max(left), bottom.max(top));
    state.x = (left + 24.0).min(state.bounds.2);
    state.y = (top + 30.0).min(state.bounds.3);
    state.active = Some(ActiveBounce {
        reminder_id,
        started: Instant::now(),
    });
    window
        .set_position(PhysicalPosition::new(state.x as i32, state.y as i32))
        .map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    Ok(())
}

fn stop_bounce(app: &AppHandle) -> Result<(), String> {
    let shared = app.state::<Shared>();
    shared
        .0
        .lock()
        .map_err(|_| "Overlay state is unavailable")?
        .active = None;
    book_window(app)?.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_bounce(app: AppHandle, reminder_id: Option<String>) -> Result<(), String> {
    start_bounce(&app, reminder_id)
}

#[tauri::command]
fn hide_bounce(app: AppHandle) -> Result<(), String> {
    stop_bounce(&app)
}

#[tauri::command]
fn set_reminders(app: AppHandle, reminders: Vec<Reminder>) -> Result<(), String> {
    if reminders
        .iter()
        .any(|r| r.id.len() > 128 || !valid_time(&r.time) || r.days.iter().any(|d| *d > 6))
    {
        return Err("A reminder has an invalid time or day".into());
    }
    let shared = app.state::<Shared>();
    let saved = {
        let mut state = shared
            .0
            .lock()
            .map_err(|_| "Reminder state is unavailable")?;
        state.saved.reminders = reminders;
        state.saved.clone()
    };
    save_settings(&app, &saved)
}

#[tauri::command]
fn set_bounce_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    let shared = app.state::<Shared>();
    let saved = {
        let mut state = shared
            .0
            .lock()
            .map_err(|_| "Reminder state is unavailable")?;
        state.saved.bounce_enabled = enabled;
        state.saved.clone()
    };
    if !enabled {
        let _ = stop_bounce(&app);
    }
    save_settings(&app, &saved)
}

fn valid_time(time: &str) -> bool {
    let parts: Vec<_> = time.split(':').collect();
    parts.len() == 2
        && parts[0].len() == 2
        && parts[1].len() == 2
        && parts[0].parse::<u32>().is_ok_and(|h| h < 24)
        && parts[1].parse::<u32>().is_ok_and(|m| m < 60)
}

#[tauri::command]
fn open_from_overlay(app: AppHandle) -> Result<(), String> {
    stop_bounce(&app)?;
    let main = app
        .get_webview_window("main")
        .ok_or("Reading window is unavailable")?;
    main.show().map_err(|e| e.to_string())?;
    main.set_focus().map_err(|e| e.to_string())?;
    app.emit_to("main", "open-reader", ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn snooze_reminder(app: AppHandle) -> Result<(), String> {
    let shared = app.state::<Shared>();
    {
        let mut state = shared
            .0
            .lock()
            .map_err(|_| "Reminder state is unavailable")?;
        if let Some(id) = state
            .active
            .as_ref()
            .and_then(|active| active.reminder_id.clone())
        {
            state.snooze = Some((id, Instant::now() + Duration::from_secs(10 * 60)));
        }
    }
    stop_bounce(&app)
}

#[tauri::command]
fn dismiss_reminder(app: AppHandle) -> Result<(), String> {
    stop_bounce(&app)
}

fn credential(key: &str) -> Result<keyring::Entry, String> {
    if key.is_empty() || key.len() > 256 {
        return Err("Invalid credential key".into());
    }
    keyring::Entry::new("LokBibleBounce", key).map_err(|e| e.to_string())
}

#[tauri::command]
fn secure_get(key: String) -> Result<Option<String>, String> {
    match credential(&key)?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn secure_set(key: String, value: String) -> Result<(), String> {
    credential(&key)?
        .set_password(&value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn secure_remove(key: String) -> Result<(), String> {
    match credential(&key)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

fn scheduler(app: AppHandle) {
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_millis(30));
            let shared = app.state::<Shared>();
            let now = Local::now();
            let mut trigger: Option<Option<String>> = None;
            let mut expire = false;
            let mut position = None;
            if let Ok(mut state) = shared.0.lock() {
                if state.saved.bounce_enabled && state.active.is_none() {
                    if let Some((id, due)) = &state.snooze {
                        if Instant::now() >= *due {
                            trigger = Some(Some(id.clone()));
                            state.snooze = None;
                        }
                    }
                    if trigger.is_none() {
                        for reminder in state.saved.reminders.clone() {
                            if !reminder.enabled
                                || !reminder
                                    .days
                                    .contains(&now.weekday().num_days_from_sunday())
                            {
                                continue;
                            }
                            let time = format!("{:02}:{:02}", now.hour(), now.minute());
                            let key = format!("{}:{}", now.date_naive(), reminder.id);
                            if reminder.time == time && !state.fired.contains(&key) {
                                trigger = Some(Some(reminder.id.clone()));
                                state.fired.insert(key);
                                break;
                            }
                        }
                    }
                }
                if let Some(active) = &state.active {
                    if active.reminder_id.is_some()
                        && active.started.elapsed() >= Duration::from_secs(120)
                    {
                        expire = true;
                    } else {
                        let (left, top, right, bottom) = state.bounds;
                        state.x += state.vx;
                        state.y += state.vy;
                        if state.x <= left || state.x >= right {
                            state.vx = -state.vx;
                            state.x = state.x.clamp(left, right);
                        }
                        if state.y <= top || state.y >= bottom {
                            state.vy = -state.vy;
                            state.y = state.y.clamp(top, bottom);
                        }
                        position = Some(PhysicalPosition::new(
                            state.x.round() as i32,
                            state.y.round() as i32,
                        ));
                    }
                }
                if state.fired.len() > 1000 {
                    state.fired.clear();
                }
            }
            if let Some(pos) = position {
                if let Ok(window) = book_window(&app) {
                    let _ = window.set_position(pos);
                }
            }
            if expire {
                let _ = stop_bounce(&app);
                let _ = app
                    .notification()
                    .builder()
                    .title("A moment in the Word")
                    .body("Your reading reminder is here whenever you're ready.")
                    .show();
            }
            if let Some(id) = trigger {
                let _ = start_bounce(&app, id);
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.show();
                let _ = main.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--quiet"]),
        ))
        .invoke_handler(tauri::generate_handler![
            show_bounce,
            hide_bounce,
            set_reminders,
            set_bounce_enabled,
            open_from_overlay,
            snooze_reminder,
            dismiss_reminder,
            secure_get,
            secure_set,
            secure_remove
        ])
        .setup(|app| {
            let saved = load_settings(app.handle());
            app.manage(Shared(Mutex::new(Runtime::new(saved))));
            let open = MenuItem::with_id(app, "open", "Open LokBibleBounce", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &quit])?;
            TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .ok_or("App icon unavailable")?
                        .clone(),
                )
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(main) = app.get_webview_window("main") {
                            let _ = main.show();
                            let _ = main.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            if std::env::args().any(|arg| arg == "--quiet") {
                if let Some(main) = app.get_webview_window("main") {
                    let _ = main.hide();
                }
            }
            scheduler(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running LokBibleBounce");
}
