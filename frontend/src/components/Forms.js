import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';

const Forms = ({ onEditForm , onBack }) => {
    const [forms, setForms] = useState([]);
    const [showNewFormModal, setShowNewFormModal] = useState(false);
    const [newFormData, setNewFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const response = await fetch('/api/forms');
            const data = await response.json();
            setForms(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching forms:', error);
            setLoading(false);
        }
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFormData),
            });
            if (response.ok) {
                setShowNewFormModal(false);
                setNewFormData({ name: '', description: '' });
                fetchForms();
            }
        } catch (error) {
            console.error('Error creating form:', error);
        }
    };

    const handleDeleteForm = async (formId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
            try {
                const response = await fetch(`/api/forms/${formId}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    fetchForms();
                }
            } catch (error) {
                console.error('Error deleting form:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tetris-blue"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Formulaires de satisfaction</h2>
                <button
                    onClick={() => setShowNewFormModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-tetris-light transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau formulaire
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forms.map((form) => (
                    <div key={form.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">{form.name}</h3>
                                <p className="text-gray-600 mt-1">{form.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEditForm(form.id)}
                                    className="p-2 text-gray-600 hover:text-tetris-blue hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteForm(form.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Créé le {new Date(form.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {showNewFormModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Nouveau formulaire</h3>
                        <form onSubmit={handleCreateForm}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom du formulaire
                                </label>
                                <input
                                    type="text"
                                    value={newFormData.name}
                                    onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newFormData.description}
                                    onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewFormModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-tetris-light"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forms;