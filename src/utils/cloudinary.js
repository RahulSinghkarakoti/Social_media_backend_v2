import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded succesfully
    // console.log("file is uploaded on cloudinary", response);
    // console.log(localFilePath)
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }//remove the file from locatstorage of server after successfull uplode on cloudinary
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      } //remove the localy saved temp file as the opration got failed
  }
};

const deleteOnCloudinary=async (publicId)=>{
  try {
    
   const result = await cloudinary.uploader.destroy(publicId);
   return result

  } catch (error) {
    console.log("ERROR: deleteOncloudinary ::".error);
    
  }
}

export {uploadOnCloudinary,deleteOnCloudinary}