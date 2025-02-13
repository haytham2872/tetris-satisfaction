import React from 'react';
import {
  Star,
  ThumbsUp,
  Clock,
  Shield,
  FileText,
  Settings,
  HelpCircle,
  Zap,
  DollarSign,
  MessageSquare
} from 'lucide-react';

const QuestionDisplay = ({ question }) => {
  const getQuestionIcon = (questionId) => {
    const icons = {
      1: ThumbsUp,
      2: Star,
      3: Clock,
      4: Shield,
      5: FileText,
      6: Settings,
      7: Zap,
      8: HelpCircle,
      9: DollarSign,
      10: MessageSquare
    };
    const IconComponent = icons[questionId];
    return IconComponent ? <IconComponent className="w-8 h-8 text-tetris-blue" /> : null;
  };

  const highlightKeywords = (text) => {
    const keywords = [
      'satisfaction', 'service', 'réponses', 'solutions', 'besoins', 'réactive', 'disponible',
      'clarté', 'processus', 'délais', 'support technique', 'tarification', 'compétitifs', 'souscription', 'réactivité',
      'formations', 'formation', 'extranet', 'améliorer', 'partenariat', 'échanges', 'services', 'produits'
    ];

    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<span class="text-tetris-blue font-bold">$1</span>'
      );
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        {getQuestionIcon(question.id)}
        <h2 className="text-2xl font-medium text-gray-900 leading-relaxed">
          {highlightKeywords(question.text)}
        </h2>
      </div>
    </div>
  );
};

export default QuestionDisplay;