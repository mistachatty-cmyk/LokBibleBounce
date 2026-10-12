# Bible content provenance

LokBounce bundles the text so reading and random verses work without a network connection. `scripts/import_bibles.py` verifies each downloaded archive by SHA-256 before producing compact JSON. The checked-in assets contain 66 books each; the eBible KJV archive includes additional books that the importer excludes for the shared first-release navigation.

| App label | eBible source | Pinned archive SHA-256 | Included verse rows |
| --- | --- | --- | ---: |
| World English Bible | [`engwebp` VPL](https://ebible.org/Scriptures/engwebp_vpl.zip), [edition details](https://ebible.org/details.php?id=engwebp) | `552e5a3e6dec9bfda4f95c2b1e86a2add1ba50b6f727609dff925de61e36e74b` | 31,103 |
| King James Version | [`eng-kjv` VPL](https://ebible.org/Scriptures/eng-kjv_vpl.zip), [edition details](https://ebible.org/bible/details.php?id=eng-kjv) | `970b0564b6816737928ebfb2fec910b96586e242c6311927f3b6c507b76418f3` | 31,102 |

The importer removes leading VPL paragraph marks from verse display text. It does not modernize the wording or silently combine verses. Some editions contain intentionally blank verse placeholders; random selection skips blank text.

The edition names appear in the reader. Before a public release, review eBible's current distribution notices, especially its World English Bible name/trademark guidance and its note on KJV printing in the United Kingdom. The decorative covers are original LokBounce art and do not claim endorsement by a translation publisher.
