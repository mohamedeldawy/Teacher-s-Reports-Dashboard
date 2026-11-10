/**
 * Google Apps Script web app for rendering public HTML files stored in Google Drive.
 *
 * Deploy as: Execute as "Me"; Who has access: "Anyone".
 * The script intentionally serves only files shared as "Anyone with the link".
 *
 * Usage: WEB_APP_URL?id=GOOGLE_DRIVE_FILE_ID
 */
function doGet(e) {
  var fileId = e && e.parameter ? String(e.parameter.id || '').trim() : '';
  if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return errorPage('Missing or invalid Google Drive file ID.');
  }

  try {
    var file = DriveApp.getFileById(fileId);

    // Do not expose private files from the account that owns this Apps Script.
    var sharing = file.getSharingAccess();
    if (sharing !== DriveApp.Access.ANYONE && sharing !== DriveApp.Access.ANYONE_WITH_LINK) {
      return errorPage('This file is not shared as Anyone with the link. Update its Google Drive sharing permission to Viewer.');
    }

    if (file.getMimeType() !== MimeType.HTML && file.getMimeType() !== 'text/html') {
      return errorPage('The selected Google Drive file is not an HTML file.');
    }

    var html = file.getBlob().getDataAsString('UTF-8');
    return HtmlService
      .createHtmlOutput(html)
      .setTitle(file.getName())
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return errorPage('Unable to read this file. Check the file ID and sharing permissions. Details: ' + String(err.message || err));
  }
}

function errorPage(message) {
  var safeMessage = String(message).replace(/[&<>"']/g, function (char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });

  return HtmlService
    .createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
      '<body style="font:14px Arial,sans-serif;padding:24px;color:#334155"><h3>HTML Preview</h3><p>' +
      safeMessage + '</p></body></html>'
    )
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
