const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;

let configured = false;

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!configured && hasCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return configured;
}

function uploadImageBuffer(buffer, fileName, folder = "thehookahshop/products") {
  if (!configureCloudinary()) {
    return Promise.reject(new Error("Cloudinary is not configured."));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: fileName,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

module.exports = {
  hasCloudinaryConfig,
  uploadImageBuffer,
};