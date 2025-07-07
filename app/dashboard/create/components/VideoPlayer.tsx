import React from "react";

//
//  <VideoPlayer
//                   videoId={chapter.videoId}
//                   title={`Preview: ${chapter.title}`}
//                   className="w-full"
//                   fallbackMessage="Video not available"
//                 />


type VideoPlayerProps = {
    videoId: string;
    title?: string;
    className?: string;
    fallbackMessage?: string;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoId,
    title,
    className = "",
    fallbackMessage = "Video not available",
}) => {
    const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;

    return (
        <div className={`flex flex-col items-center ${className}`}>
            {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
            <div className="w-full aspect-w-16 aspect-h-9">
                <iframe
                    className="w-full h-full rounded-lg shadow-lg"
                    src={youtubeEmbedUrl}
                    title={title || "YouTube Video"}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
            {!videoId && (
                <p className="text-sm text-gray-500 mt-2">{fallbackMessage}</p>
            )}
        </div>
    );
};

export default VideoPlayer;
