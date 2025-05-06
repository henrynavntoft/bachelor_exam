export default function Footer() {
    return (
        <footer className="bg-gray-100 py-4">
            <div className="max-w-6xl mx-auto px-4">
                <p className="text-center text-gray-600">
                    &copy; {new Date().getFullYear()} Meet & Greet | Culture Connect
                </p>
            </div>
        </footer>
    );
}