export default function Footer() {
    return (
        <footer className=" py-4 bg-[#1A6258]">
            <div className="max-w-6xl mx-auto px-4">
                <p className="text-center text-white">
                    &copy; {new Date().getFullYear()} Meet & Greet | Culture Connect
                </p>
            </div>
        </footer>
    );
}