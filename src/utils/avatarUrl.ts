// Square photo of a person, cropped around the face by Cloudinary ("c_fill,g_face"); other URLs as is
export const avatarUrl = (url: string | null | undefined, size = 96) => {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/c_fill,g_face,w_${size * 2},h_${size * 2},f_auto,q_auto/`);
};
