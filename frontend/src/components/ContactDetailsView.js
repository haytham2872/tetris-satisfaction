import React, { useState, useEffect } from 'react';
import {User, Phone, Mail, Clock, Download, MessageSquare } from 'lucide-react';
import * as XLSX from 'xlsx';

const ContactDetailsView = ({ formId, onBack }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInfo, setFormInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Construire l'URL avec le formId si présent
        const contactsUrl = formId 
          ? `https://tetris-forms.azurewebsites.net/api/low-satisfaction?form_id=${formId}`
          : 'https://tetris-forms.azurewebsites.net/api/low-satisfaction';

        const promises = [fetch(contactsUrl)];

        // Récupérer les informations du formulaire si formId est présent
        if (formId) {
          promises.push(
            fetch(`https://tetris-forms.azurewebsites.net/api/forms/${formId}`)
          );
        }

        const responses = await Promise.all(promises);
        
        if (!responses.every(response => response.ok)) {
          throw new Error('Failed to fetch data');
        }

        const [contactsData, formData] = await Promise.all(
          responses.map(response => response.json())
        );

        setContacts(contactsData);
        if (formData) {
          setFormInfo(formData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => ({
      'ID Formulaire': contact.form_id,
      'Formulaire': formInfo?.name || `-`,
      'Nom': contact.name,
      'Téléphone': contact.phone,
      'Email': contact.email,
      'Commentaire': contact.commentaire || '-',
      'Date': new Date(contact.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, `contacts${formId ? `_${formInfo?.name || formId}` : ''}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-6">
              Contacts à Suivre
              {formInfo && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  | {formInfo.name}
                </span>
              )}
            </h1>
            <p className="mt-2 text-gray-600">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} à suivre
              {formInfo && ' pour ce formulaire'}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retour
            </button>

            {contacts.length > 0 && (
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-tetris-light transition-colors"
              >
                <Download size={20} />
                Télécharger Excel
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl"
            >
              <div className="grid md:grid-cols-4 gap-6 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <User className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{contact.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-tetris-blue" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {contact.commentaire && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-tetris-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Commentaire</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {contact.commentaire}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {contacts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun contact à suivre
              </h3>
              <p className="text-gray-500 mt-2">
                {formInfo 
                  ? "Aucun contact à suivre pour ce formulaire."
                  : "Les contacts apparaîtront ici lorsque des utilisateurs nécessiteront une attention particulière."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsView;