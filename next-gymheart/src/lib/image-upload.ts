const maxImageUploadBytes = 3 * 1024 * 1024;

export class ImageUploadError extends Error {
  constructor(message = "Invalid image upload") {
    super(message);
    this.name = "ImageUploadError";
  }
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

export async function imageFieldToUrl(formData: FormData, fileField: string, urlField: string) {
  const file = formData.get(fileField);
  if (!isFile(file)) return clean(formData.get(urlField));

  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("Only image files are supported");
  }

  if (file.size > maxImageUploadBytes) {
    throw new ImageUploadError("Image is too large");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
