import Image from "next/image";


const Logo = () => {
    return (
        <Image
        src="/logo.png"
        alt="Logo"
        width={150}
        height={80}
        className="h-10 w-auto"
        />
    );
};

export default Logo;
