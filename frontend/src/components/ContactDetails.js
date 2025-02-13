import React, { useState } from 'react';
import { AlertCircle, User, Phone, Mail, MessageSquare, ArrowLeft } from 'lucide-react';

const ContactDetails = ({ responses, onSubmit, onSkip }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        commentaire: ''
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Le nom est requis';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Le numéro de téléphone est requis';
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Numéro de téléphone invalide';
        }

        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Email invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="animate-slideIn">

            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-tetris-blue to-blue-600 p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Nous sommes à votre écoute</h2>
                    <p className="text-blue-50 opacity-90">
                        Votre satisfaction est notre priorité
                    </p>
                </div>

                {/* Alert Section */}
                <div className="p-6">
                    <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start animate-fadeIn">
                        <AlertCircle className="h-6 w-6 text-tetris-blue mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-tetris-blue mb-1">Votre avis compte</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Nous avons remarqué que vous n'êtes pas entièrement satisfait de nos services.
                                Laissez-nous vos coordonnées pour que nous puissions vous recontacter rapidement 
                                et trouver ensemble des solutions adaptées à vos besoins.
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="animate-slideUp animation-delay-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom complet
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                                             transition-all duration-200 ease-in-out"
                                    placeholder="John Doe"
                                />
                            </div>
                            {errors.name && <p className="mt-1 text-sm text-red-600 animate-shake">{errors.name}</p>}
                        </div>

                        <div className="animate-slideUp animation-delay-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Numéro de téléphone
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                                             transition-all duration-200 ease-in-out"
                                    placeholder="0612345678"
                                />
                            </div>
                            {errors.phone && <p className="mt-1 text-sm text-red-600 animate-shake">{errors.phone}</p>}
                        </div>

                        <div className="animate-slideUp animation-delay-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                                             transition-all duration-200 ease-in-out"
                                    placeholder="john@example.com"
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-sm text-red-600 animate-shake">{errors.email}</p>}
                        </div>
                        <div className="animate-slideUp animation-delay-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Commentaire (optionnel)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MessageSquare className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    value={formData.commentaire}
                                    onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-tetris-blue focus:border-transparent
                                            transition-all duration-200 ease-in-out min-h-[100px] resize-none"
                                    placeholder="Ajoutez un commentaire supplémentaire..."
                                />
                            </div>
                        </div>
                        {/* Buttons Section */}
                        <div className="flex justify-between pt-6 animate-slideUp animation-delay-400">
                            <button
                                type="button"
                                onClick={onSkip}
                                className="flex items-center px-6 py-3 bg-gray-50 text-gray-700 rounded-xl
                                         hover:bg-gray-100 transition-all duration-200 ease-in-out
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Retourner au questionnaire
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-tetris-blue text-white rounded-xl
                                         hover:bg-blue-700 transform hover:-translate-y-1
                                         transition-all duration-200 ease-in-out
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tetris-blue"
                            >
                                Envoyer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactDetails;