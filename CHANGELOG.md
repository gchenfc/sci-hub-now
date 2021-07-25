# Changelog

## TODO

- [ ] Custom auto-naming formats
- [ ] Better journal/venue abbreviations
- [ ] Better `shorttitles` in metadata
- [ ] Custom email address to use with doi.crossref.org
- [ ] Add a text field for custom regex pattern(s)
- [ ] Test unreleased changes on firefox & edge, and also check permissions differences amongst different browsers

## Unreleased

### Added
- [#28](https://github.com/gchenfc/sci-hub-now/pull/28) Add default keyboard shortcuts
- [#25](https://github.com/gchenfc/sci-hub-now/pull/25) Auto-download pdf & auto-naming
  - The user can opt to automatically download a pdf and bypass actually visiting sci-hub by enabling the setting in the options page.
  - Enabling auto-name will (if auto-download is enabled) automatically name the downloaded pdfs according to the naming convention `LastnameYearVenue_shorttitle.pdf`.  For example, `Grady19vppc_mostEfficientVehicle.pdf` for [10.1109/VPPC46532.2019.8952212](https://doi.org/10.1109/VPPC46532.2019.8952212).  Note that the `shorttitle` is almost always missing from the metadata.
- [#23](https://github.com/gchenfc/sci-hub-now/pull/23) MS Edge support
- [#18](https://github.com/gchenfc/sci-hub-now/pull/18) Context menu support (right click on a DOI link)

### Modified
- [#27](https://github.com/gchenfc/sci-hub-now/pull/27) DOI regex update - only accept DOI's in the form of `a href="..."`
- [#24](https://github.com/gchenfc/sci-hub-now/pull/24) Icon changed for readibility in dark mode

## v0.1.0

### Added
- [#11](https://github.com/gchenfc/sci-hub-now/pull/11) List of active sci-hub links and javascript status checker
  - In the options page, a table of active links is populated from a github json file and color-coded green/red for working/not working
  - Upon requesting a paper, the extension will auto-check if the server is not working and prompt the user to go to the options page to select a working link.
- [#10](https://github.com/gchenfc/sci-hub-now/pull/10) Option to open sci-hub paper in current tab rather than new tab
