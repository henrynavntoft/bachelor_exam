export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center min-h-screen ">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
    );
}