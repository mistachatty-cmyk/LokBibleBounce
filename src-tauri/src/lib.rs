use chrono::{Datelike, Local, NaiveTime};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};
use tauri_plugin_autostart::MacosLauncher;
#[cfg(debug_assertions)]
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_notification::NotificationExt;

const BOOK_WIDTH: f64 = 170.0;
const BOOK_HEIGHT: f64 = 170.0;
const MENU_WIDTH: f64 = 270.0;
const MENU_HEIGHT: f64 = 310.0;

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum RestMode { Corner, Dashboard, Off }

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum RestCorner { TopLeft, TopRight, BottomLeft, BottomRight }

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
    #[serde(default = "default_true")]
    bounce_enabled: bool,
    #[serde(default = "default_rest_mode")]
    rest_mode: RestMode,
    #[serde(default = "default_rest_corner")]
    rest_corner: RestCorner,
}

fn default_true() -> bool { true }
fn default_rest_mode() -> RestMode { RestMode::Corner }
fn default_rest_corner() -> RestCorner { RestCorner::BottomRight }

impl Default for SavedSettings {
    fn default() -> Self {
        Self {
            reminders: Vec::new(),
            bounce_enabled: true,
            rest_mode: RestMode::Corner,
            rest_corner: RestCorner::BottomRight,
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
    hovered: bool,
    menu_open: bool,
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
            hovered: false,
            menu_open: false,
            snooze: None,
            fired: HashSet::new(),
            x: 0.0,
            y: 0.0,
            vx: 92.0,
            vy: 68.0,
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

fn monitor_bounds(app: &AppHandle, window: &tauri::WebviewWindow, width: f64, height: f64) -> Result<(f64, f64, f64, f64, f64), String> {
    let monitor = window.current_monitor().ok().flatten()
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No display was found".to_string())?;
    let scale = monitor.scale_factor();
    let origin = monitor.position();
    let size = monitor.size();
    let left = origin.x as f64;
    let top = origin.y as f64;
    let _ = app;
    Ok((left, top, (left + size.width as f64 - width * scale).max(left), (top + size.height as f64 - height * scale).max(top), scale))
}

fn corner_position(bounds: (f64, f64, f64, f64), corner: RestCorner, inset: f64) -> PhysicalPosition<i32> {
    let (left, top, right, bottom) = bounds;
    let x = if matches!(corner, RestCorner::TopRight | RestCorner::BottomRight) { right - inset } else { left + inset };
    let y = if matches!(corner, RestCorner::BottomLeft | RestCorner::BottomRight) { bottom - inset } else { top + inset };
    PhysicalPosition::new(x.clamp(left, right).round() as i32, y.clamp(top, bottom).round() as i32)
}

fn rest_book(app: &AppHandle) -> Result<(), String> {
    let window = book_window(app)?;
    let (mode, corner, was_menu_open) = {
        let shared = app.state::<Shared>();
        let mut state = shared.0.lock().map_err(|_| "Overlay state is unavailable")?;
        let was_menu_open = state.menu_open;
        state.active = None;
        state.hovered = false;
        state.menu_open = false;
        (state.saved.rest_mode, state.saved.rest_corner, was_menu_open)
    };
    let _ = app.emit_to("overlay", "overlay-state", "rest");
    if mode == RestMode::Off { return window.hide().map_err(|e| e.to_string()); }
    if was_menu_open { window.set_size(LogicalSize::new(BOOK_WIDTH, BOOK_HEIGHT)).map_err(|e| e.to_string())?; }
    let (left, top, right, bottom, scale) = monitor_bounds(app, &window, BOOK_WIDTH, BOOK_HEIGHT)?;
    window.set_position(corner_position((left, top, right, bottom), corner, 16.0 * scale)).map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())
}

fn start_bounce(app: &AppHandle, reminder_id: Option<String>) -> Result<(), String> {
    let window = book_window(app)?;
    let was_menu_open = app.state::<Shared>().0.lock().map_err(|_| "Overlay state is unavailable")?.menu_open;
    if was_menu_open { window.set_size(LogicalSize::new(BOOK_WIDTH, BOOK_HEIGHT)).map_err(|e| e.to_string())?; }
    let (left, top, right, bottom, scale) = monitor_bounds(app, &window, BOOK_WIDTH, BOOK_HEIGHT)?;
    let shared = app.state::<Shared>();
    let mut state = shared
        .0
        .lock()
        .map_err(|_| "Overlay state is unavailable")?;
    state.bounds = (left, top, right.max(left), bottom.max(top));
    state.x = (left + 24.0).min(state.bounds.2);
    state.y = (top + 30.0).min(state.bounds.3);
    state.vx = 92.0 * scale;
    state.vy = 68.0 * scale;
    let is_reminder = reminder_id.is_some();
    state.active = Some(ActiveBounce {
        reminder_id,
        started: Instant::now(),
    });
    state.hovered = false;
    state.menu_open = false;
    let position = PhysicalPosition::new(state.x as i32, state.y as i32);
    drop(state);
    window
        .set_position(position)
        .map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    let _ = app.emit_to("overlay", "bounce-mode", is_reminder);
    let _ = app.emit_to("overlay", "overlay-state", "bounce");
    Ok(())
}

fn stop_bounce(app: &AppHandle) -> Result<(), String> {
    let shared = app.state::<Shared>();
    let mut state = shared.0.lock().map_err(|_| "Overlay state is unavailable")?;
    state.active = None;
    state.hovered = false;
    drop(state);
    book_window(app)?.hide().map_err(|e| e.to_string())
}

fn resume_passive(app: &AppHandle) -> Result<(), String> {
    let (mode, active) = app
        .state::<Shared>()
        .0
        .lock()
        .map(|state| (state.saved.rest_mode, state.active.is_some()))
        .map_err(|_| "Overlay state is unavailable")?;
    let reader_visible = app
        .get_webview_window("main")
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(false);
    if !active && !reader_visible {
        if mode == RestMode::Off { book_window(app)?.hide().map_err(|e| e.to_string())?; }
        else { rest_book(app)?; }
    }
    Ok(())
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
fn is_reminder_bounce(app: AppHandle) -> bool {
    app.state::<Shared>()
        .0
        .lock()
        .ok()
        .and_then(|state| state.active.as_ref().map(|active| active.reminder_id.is_some()))
        .unwrap_or(false)
}

#[tauri::command]
fn set_bounce_hovered(app: AppHandle, hovered: bool) -> Result<(), String> {
    app.state::<Shared>()
        .0
        .lock()
        .map_err(|_| "Overlay state is unavailable")?
        .hovered = hovered;
    Ok(())
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
    save_settings(&app, &saved)?;
    if !enabled { stop_bounce(&app)?; resume_passive(&app) } else { resume_passive(&app) }
}

#[tauri::command]
fn set_rest_preferences(app: AppHandle, mode: RestMode, corner: RestCorner) -> Result<(), String> {
    let saved = {
        let shared = app.state::<Shared>();
        let mut state = shared.0.lock().map_err(|_| "Overlay state is unavailable")?;
        state.saved.rest_mode = mode;
        state.saved.rest_corner = corner;
        state.saved.clone()
    };
    save_settings(&app, &saved)?;
    if mode == RestMode::Off {
        if app.state::<Shared>().0.lock().map_err(|_| "Overlay state is unavailable")?.active.is_none() { rest_book(&app) } else { Ok(()) }
    } else { resume_passive(&app) }
}

#[tauri::command]
fn set_overlay_menu(app: AppHandle, open: bool) -> Result<(), String> {
    let window = book_window(&app)?;
    let corner = {
        let shared = app.state::<Shared>();
        let mut state = shared.0.lock().map_err(|_| "Overlay state is unavailable")?;
        state.menu_open = open;
        state.hovered = open;
        state.saved.rest_corner
    };
    if open {
        window.set_size(LogicalSize::new(MENU_WIDTH, MENU_HEIGHT)).map_err(|e| e.to_string())?;
        let (left, top, right, bottom, scale) = monitor_bounds(&app, &window, MENU_WIDTH, MENU_HEIGHT)?;
        window.set_position(corner_position((left, top, right, bottom), corner, 16.0 * scale)).map_err(|e| e.to_string())?;
        let _ = app.emit_to("overlay", "overlay-state", "menu");
        Ok(())
    } else { rest_book(&app) }
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
    stop_bounce(&app)?;
    resume_passive(&app)
}

#[tauri::command]
fn dismiss_reminder(app: AppHandle) -> Result<(), String> {
    stop_bounce(&app)?;
    resume_passive(&app)
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

fn advance_axis(position: &mut f64, velocity: &mut f64, min: f64, max: f64, seconds: f64) -> bool {
    if max <= min {
        *position = min;
        return false;
    }
    *position += *velocity * seconds;
    let mut impact = false;
    if *position <= min {
        *position = min + (min - *position);
        *velocity = (*velocity).abs();
        impact = true;
    }
    if *position >= max {
        *position = max - (*position - max);
        *velocity = -(*velocity).abs();
        impact = true;
    }
    *position = (*position).clamp(min, max);
    impact
}

fn scheduler(app: AppHandle) {
    thread::spawn(move || {
        let mut last_frame = Instant::now();
        let mut last_schedule_check = Instant::now() - Duration::from_secs(1);
        loop {
            let moving = app
                .state::<Shared>()
                .0
                .lock()
                .map(|state| state.active.is_some())
                .unwrap_or(false);
            thread::sleep(if moving {
                Duration::from_millis(16)
            } else {
                Duration::from_secs(1)
            });
            let frame_time = Instant::now();
            // Resuming after a long pause should not teleport the book.
            let seconds = frame_time.duration_since(last_frame).as_secs_f64().min(0.05);
            last_frame = frame_time;
            let check_schedules = frame_time.duration_since(last_schedule_check) >= Duration::from_secs(1);
            if check_schedules {
                last_schedule_check = frame_time;
            }
            let shared = app.state::<Shared>();
            let now = Local::now();
            let mut trigger: Option<Option<String>> = None;
            let mut expire = false;
            let mut position = None;
            let mut impact = None;
            if let Ok(mut state) = shared.0.lock() {
                let can_trigger = state.active.as_ref().is_none_or(|active| active.reminder_id.is_none());
                if can_trigger && check_schedules {
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
                            let Ok(time) = NaiveTime::parse_from_str(&reminder.time, "%H:%M")
                            else {
                                continue;
                            };
                            let delay = now.time().signed_duration_since(time).num_seconds();
                            let key = format!("{}:{}", now.date_naive(), reminder.id);
                            if (0..120).contains(&delay) && !state.fired.contains(&key) {
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
                    } else if !state.hovered {
                        let (left, top, right, bottom) = state.bounds;
                        let (mut x, mut vx) = (state.x, state.vx);
                        let (mut y, mut vy) = (state.y, state.vy);
                        let horizontal = advance_axis(&mut x, &mut vx, left, right, seconds);
                        let vertical = advance_axis(&mut y, &mut vy, top, bottom, seconds);
                        (state.x, state.vx, state.y, state.vy) = (x, vx, y, vy);
                        impact = match (horizontal, vertical) {
                            (true, true) => Some("corner"),
                            (true, false) => Some("horizontal"),
                            (false, true) => Some("vertical"),
                            _ => None,
                        };
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
            if let Some(edge) = impact {
                let _ = app.emit_to("overlay", "bounce-impact", edge);
            }
            if expire {
                let _ = stop_bounce(&app);
                let _ = resume_passive(&app);
                let _ = app
                    .notification()
                    .builder()
                    .title("A moment in the Word")
                    .body("Your reading reminder is here whenever you're ready.")
                    .show();
            }
            if let Some(id) = trigger {
                if start_bounce(&app, id).is_err() {
                    let _ = app
                        .notification()
                        .builder()
                        .title("A moment in the Word")
                        .body("It's time for your Bible reading moment.")
                        .show();
                }
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
            is_reminder_bounce,
            set_bounce_hovered,
            set_reminders,
            set_bounce_enabled,
            set_rest_preferences,
            set_overlay_menu,
            open_from_overlay,
            snooze_reminder,
            dismiss_reminder,
            secure_get,
            secure_set,
            secure_remove
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            app.deep_link().register_all()?;
            let saved = load_settings(app.handle());
            app.manage(Shared(Mutex::new(Runtime::new(saved))));
            let open = MenuItem::with_id(app, "open", "Open LokBibleBounce", true, None::<&str>)?;
            let pause = MenuItem::with_id(app, "pause", "Rest in corner", true, None::<&str>)?;
            let resume = MenuItem::with_id(app, "resume", "Bounce now", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &pause, &resume, &quit])?;
            TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .ok_or("App icon unavailable")?
                        .clone(),
                )
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        let _ = stop_bounce(app);
                        if let Some(main) = app.get_webview_window("main") {
                            let _ = main.show();
                            let _ = main.set_focus();
                        }
                    }
                    "pause" => { let _ = rest_book(app); }
                    "resume" => { let _ = start_bounce(app, None); }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            scheduler(app.handle().clone());
            let handle = app.handle().clone();
            thread::spawn(move || {
                thread::sleep(Duration::from_millis(350));
                if rest_book(&handle).is_ok() {
                    if let Some(main) = handle.get_webview_window("main") {
                        let _ = main.hide();
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                    let _ = resume_passive(&window.app_handle());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running LokBibleBounce");
}

#[cfg(test)]
mod motion_tests {
    use super::advance_axis;

    #[test]
    fn reflects_at_both_edges_without_sticking() {
        let (mut x, mut velocity) = (99.0, 92.0);
        assert!(advance_axis(&mut x, &mut velocity, 0.0, 100.0, 0.05));
        assert!((x - 96.4).abs() < 1e-9);
        assert_eq!(velocity, -92.0);

        let (mut x, mut velocity) = (1.0, -68.0);
        assert!(advance_axis(&mut x, &mut velocity, 0.0, 100.0, 0.05));
        assert!((x - 2.4).abs() < 1e-9);
        assert_eq!(velocity, 68.0);
    }

    #[test]
    fn distance_depends_on_elapsed_time_and_small_displays_stay_bounded() {
        let (mut x, mut velocity) = (10.0, 92.0);
        assert!(!advance_axis(&mut x, &mut velocity, 0.0, 100.0, 0.016));
        assert!(!advance_axis(&mut x, &mut velocity, 0.0, 100.0, 0.032));
        assert!((x - 14.416).abs() < 1e-9);

        assert!(!advance_axis(&mut x, &mut velocity, 5.0, 5.0, 0.05));
        assert_eq!(x, 5.0);
    }
}
