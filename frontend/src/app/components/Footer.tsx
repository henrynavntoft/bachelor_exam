import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-brand text-white">
            <div className="max-w-7xl mx-auto">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-10">
                    {/* Brand section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Meet & Greet</h3>
                        <p className="text-sm text-white/80">
                            Connecting people through cultural experiences and meaningful events.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <Link href="#" className="hover:text-white/80 transition-colors">
                                <Facebook size={20} />
                            </Link>
                            <Link href="#" className="hover:text-white/80 transition-colors">
                                <Instagram size={20} />
                            </Link>
                            <Link href="#" className="hover:text-white/80 transition-colors">
                                <Twitter size={20} />
                            </Link>
                            <Link href="mailto:contact@culturemeetngreet.com" className="hover:text-white/80 transition-colors">
                                <Mail size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="hover:text-white/80 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/events" className="hover:text-white/80 transition-colors">
                                    Browse Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="hover:text-white/80 transition-colors">
                                    Sign In
                                </Link>
                            </li>
                            <li>
                                <Link href="/signup" className="hover:text-white/80 transition-colors">
                                    Create Account
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Resources</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="#" className="hover:text-white/80 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white/80 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white/80 transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white/80 transition-colors">
                                    Host Guide
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Contact Us</h3>
                        <ul className="space-y-2 text-sm">
                            <li>Copenhagen, Denmark</li>
                            <li><Link href="mailto:info@examproject.xyz">info@examproject.xyz</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar with copyright and legal */}
                <div className="border-t border-white/20 px-6 py-5">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-white/80">
                            &copy; {currentYear} Meet & Greet | Culture Connect. All rights reserved.
                        </p>
                        <div className="flex space-x-4 mt-3 md:mt-0 text-sm text-white/80">
                            <Link href="#" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}