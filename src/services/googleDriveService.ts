
/**
 * Service to handle Google Drive API interactions
 */

export interface DriveUploadResponse {
  id: string;
  webViewLink: string;
}

export async function uploadToDrive(file: File, accessToken: string): Promise<DriveUploadResponse> {
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // 1. Upload the file
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Drive Upload Failed: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  // 2. Make the file public (anyone with link can view)
  // This is necessary so users in the "Public Portal" can see it
  await makeFilePublic(data.id, accessToken);

  return {
    id: data.id,
    webViewLink: data.webViewLink,
  };
}

export async function deleteFromDrive(fileId: string, accessToken: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Google Drive Delete Failed: ${error.error?.message || 'Unknown error'}`);
  }
}

async function makeFilePublic(fileId: string, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to set public permissions:', error);
    // We don't throw here to avoid failing the whole upload if just the sharing fails
    // However, the file might not be visible publicly
  }
}
