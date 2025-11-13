// Google Apps Script for listing images from Google Drive folders
// Deploy as a web app with "Execute as: Me" and "Who has access: Anyone"

/**
 * Handles GET requests to list images from a Google Drive folder
 * Query parameter: folder (the folder ID from Google Drive)
 * Returns: JSON array of image URLs
 */
function doGet(e) {
  const folderId = e.parameter.folder;
  
  if (!folderId) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Missing 'folder' parameter"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    
    const imageUrls = [];
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      
      // Only include image files
      if (imageTypes.includes(mimeType)) {
        const fileId = file.getId();
        // Use the uc?export=view format for direct image URLs
        // Format: https://drive.google.com/uc?export=view&id=<fileId>
        const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        imageUrls.push(imageUrl);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(imageUrls))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Legacy function for Google Sheets (if still needed)
function doGetSheets() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Listings');
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const json = data.map(row => {
    const o = {};
    headers.forEach((h, i) => o[h] = row[i]);
    return o;
  });
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
