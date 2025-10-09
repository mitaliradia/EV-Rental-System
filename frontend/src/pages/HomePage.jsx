import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="relative text-center py-24 sm:py-32 lg:py-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
            <div className="absolute inset-0 bg-[url('/src/assets/hero-bg.svg')] bg-cover opacity-10"></div>
            
            <div className="relative container mx-auto px-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                    Drive the Future, Today.
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-indigo-100">
                    Experience the thrill of electric. Rent a premium EV with seamless verification, secure booking, and unparalleled service.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Link to="/vehicles" className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-transform transform hover:scale-105">
                        Explore Our Fleet
                    </Link>
                    <Link to="/register" className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-indigo-600 transition-colors">
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default HomePage;