import React, { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";
import https from 'https';
interface ImageFetcherProps {
  topic: string;
}

function ImageFetcher({ topic }: ImageFetcherProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const instance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });
  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        const response = await instance.get(`/api/image?topic=${encodeURIComponent(topic)}`, {
        
        });
        setImageUrl(response.data.data.urls.regular);
      } catch (error) {
        console.error("Error fetching image:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [topic]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={topic || "Image"}
          width={500} // Set the desired width
          height={300} // Set the desired height
        
      
        />
      ) : (
        <p>No image available</p>
      )}
    </div>
  );
}

export default ImageFetcher;
