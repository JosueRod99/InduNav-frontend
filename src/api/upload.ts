import apiClient from './client';

export const ImageType = {
  LAYOUT: 'layouts',
  QR_CODE: 'qr-codes',
  AVATAR: 'avatars',
  LOGO: 'logos',
  AREA_IMAGE: 'areas',
  OTHER: 'other',
} as const;

export type ImageType = typeof ImageType[keyof typeof ImageType];

export interface UploadOptions {
  organizationId?: string;
  plantId?: string;
  imageType: ImageType;
  customFolder?: string;
}

export interface UploadedImage {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface UploadImageResponse {
  message: string;
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface UploadMultipleImagesResponse {
  message: string;
  images: UploadedImage[];
}

/**
 * Upload single image to Cloudinary
 */
export const uploadImage = async (
  file: File,
  options: UploadOptions
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('image_type', options.imageType);

  if (options.organizationId) {
    formData.append('organization_id', options.organizationId);
  }

  if (options.plantId) {
    formData.append('plant_id', options.plantId);
  }

  if (options.customFolder) {
    formData.append('custom_folder', options.customFolder);
  }

  const { data } = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadImages = async (
  files: File[],
  options: UploadOptions
): Promise<UploadMultipleImagesResponse> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('images', file);
  });

  formData.append('image_type', options.imageType);

  if (options.organizationId) {
    formData.append('organization_id', options.organizationId);
  }

  if (options.plantId) {
    formData.append('plant_id', options.plantId);
  }

  if (options.customFolder) {
    formData.append('custom_folder', options.customFolder);
  }

  const { data } = await apiClient.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (urlOrPublicId: string): Promise<void> => {
  await apiClient.delete('/upload/image', {
    data: {
      url: urlOrPublicId.startsWith('http') ? urlOrPublicId : undefined,
      public_id: !urlOrPublicId.startsWith('http') ? urlOrPublicId : undefined,
    },
  });
};
