import {getSupabaseClient} from '@play/supabase-client';

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadImage(
  arrayBuffer: ArrayBuffer,
  folder: string,
  contentType = 'image/jpeg',
): Promise<UploadResult> {
  const supabase = getSupabaseClient();
  const {
    data: {session},
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `/api/upload?folder=${encodeURIComponent(folder)}`,
    {
      method: 'POST',
      headers,
      body: arrayBuffer,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({error: 'Upload failed'}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
