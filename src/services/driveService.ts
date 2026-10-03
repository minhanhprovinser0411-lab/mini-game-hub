import { SaveData, DriveFileInfo } from '../types';
import { getAccessToken } from './firebase';

const SAVE_FILENAME = 'playverse_save_data.json';

/**
 * Searches user's Google Drive for existing save file created by the app
 */
export async function findSaveFileOnDrive(): Promise<DriveFileInfo | null> {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');

  const query = encodeURIComponent(`name = '${SAVE_FILENAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,modifiedTime,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Lỗi truy vấn Drive: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    const file = data.files[0];
    return {
      id: file.id,
      name: file.name,
      size: file.size,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
    };
  }

  return null;
}

/**
 * Uploads or updates save data to Google Drive
 */
export async function uploadSaveToDrive(saveData: SaveData): Promise<DriveFileInfo> {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');

  const existingFile = await findSaveFileOnDrive();
  const fileContent = JSON.stringify(saveData, null, 2);

  if (existingFile) {
    // Update existing file content
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || `Lỗi cập nhật file Drive: ${response.statusText}`);
    }

    // Refresh file metadata
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?fields=id,name,size,modifiedTime,webViewLink`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const updatedMeta = await metaRes.json();
    return {
      id: updatedMeta.id,
      name: updatedMeta.name,
      size: updatedMeta.size,
      modifiedTime: updatedMeta.modifiedTime,
      webViewLink: updatedMeta.webViewLink,
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: SAVE_FILENAME,
      mimeType: 'application/json',
      description: 'PlayVerse Minigame Hub Cloud Save Data',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,modifiedTime,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || `Lỗi tạo file Drive: ${response.statusText}`);
    }

    const created = await response.json();
    return {
      id: created.id,
      name: created.name,
      size: created.size,
      modifiedTime: created.modifiedTime,
      webViewLink: created.webViewLink,
    };
  }
}

/**
 * Downloads save data from Google Drive
 */
export async function downloadSaveFromDrive(fileId: string): Promise<SaveData> {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Lỗi tải file từ Drive: ${response.statusText}`);
  }

  const data: SaveData = await response.json();
  if (!data || !data.stats) {
    throw new Error('Định dạng file lưu trữ trên Drive không hợp lệ.');
  }

  return data;
}

/**
 * Deletes save file from Google Drive (MUST be preceded by explicit UI confirmation)
 */
export async function deleteSaveFileFromDrive(fileId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) throw new Error('Chưa đăng nhập Google hoặc phiên làm việc đã hết hạn.');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || `Lỗi xóa file trên Drive: ${response.statusText}`);
  }

  return true;
}
