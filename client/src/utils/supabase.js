/* eslint-disable no-unused-vars */
import { supabase } from '../components/Supabase';

export const uploadImageToSupabase = async (file, folder) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      throw new Error('Invalid file type. Only JPEG and PNG files are allowed.');
    }

    // Create unique filename with better sanitization
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedName}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Upload file with explicit content type
    const { data, error: uploadError } = await supabase.storage
      .from('filesStore')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Check for RLS policy error
      if (uploadError.message?.includes('row-level security')) {
        throw new Error('Storage permission denied. Please contact administrator to enable file uploads.');
      }
      throw new Error(uploadError.message || 'Failed to upload file');
    }

    // Get public URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from('filesStore')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('URL error:', urlError);
      throw new Error(urlError.message || 'Failed to get public URL');
    }

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    // Return a more user-friendly error message
    if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
      throw new Error('Unable to upload file due to permission settings. Please contact administrator.');
    }
    throw new Error(`Upload failed: ${error.message}`);
  }
}; 