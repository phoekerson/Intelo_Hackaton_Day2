class PitchGenerator {
    constructor() {
        this.apiKey = 'AIzaSyAAuHtqOKZVbRjy2GZh4IBNVDsYQhMb8B8';
        this.currentPitch = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkApiKey();
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = ['projectIdea', 'targetMarket', 'businessModel', 'competition'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            
            // Ajouter un message d'erreur sous chaque input
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message-input';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '0.8em';
            errorDiv.style.marginTop = '5px';
            errorDiv.style.display = 'none';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);

            // Validation en temps réel pendant la saisie
            input.addEventListener('input', (e) => {
                this.validateInput(e.target);
            });

            // Validation au focus out
            input.addEventListener('blur', (e) => {
                this.validateInput(e.target);
            });
        });
    }

    validateInput(input) {
        const value = input.value;
        const errorDiv = input.nextElementSibling;
        const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};:"\\|<>/?]+/;
        const numbersRegex = /\d/;
        
        // Réinitialiser les styles
        input.style.borderColor = '';
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Vérifications
        if (value.trim() === '') {
            this.showInputError(input, errorDiv, 'Ce champ ne peut pas être vide');
            return false;
        }

        if (numbersRegex.test(value)) {
            this.showInputError(input, errorDiv, 'Les chiffres ne sont pas autorisés dans ce champ');
            return false;
        }

        if (specialCharsRegex.test(value)) {
            this.showInputError(input, errorDiv, 'Les caractères spéciaux ne sont pas autorisés');
            return false;
        }

        if (value.length < 10) {
            this.showInputError(input, errorDiv, 'Le texte doit contenir au moins 10 caractères');
            return false;
        }

        return true;
    }

    showInputError(input, errorDiv, message) {
        input.style.borderColor = 'red';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    validateForm(formData) {
        const requiredFields = ['projectIdea', 'targetMarket', 'businessModel', 'competition'];
        let isValid = true;

        for (const field of requiredFields) {
            const input = document.getElementById(field);
            if (!this.validateInput(input)) {
                isValid = false;
            }
        }

        if (!isValid) {
            return false;
        }

        // Validation supplémentaire des longueurs minimales
        const minLengths = {
            projectIdea: 20,
            targetMarket: 10,
            businessModel: 10,
            competition: 20
        };

        for (const [field, minLength] of Object.entries(minLengths)) {
            if (formData[field].length < minLength) {
                const input = document.getElementById(field);
                const errorDiv = input.nextElementSibling;
                this.showInputError(
                    input,
                    errorDiv,
                    `Le texte doit contenir au moins ${minLength} caractères`
                );
                isValid = false;
            }
        }

        return isValid;
    }

    bindEvents() {
        // Formulaire principal
        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generatePitch();
        });

        // Bouton de test
        document.getElementById('testBtn').addEventListener('click', () => {
            this.generateTestPitch();
        });

        // Boutons d'action
        document.getElementById('editBtn').addEventListener('click', () => this.editPitch());
        document.getElementById('shareBtn').addEventListener('click', () => this.sharePitch());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToPDF());

        // Modal API
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        document.getElementById('cancelApiKey').addEventListener('click', () => this.hideApiModal());
        
        // Fermer modal en cliquant à l'extérieur
        document.getElementById('apiModal').addEventListener('click', (e) => {
            if (e.target.id === 'apiModal') {
                this.hideApiModal();
            }
        });
    }

    checkApiKey() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        if (!this.apiKey) {
            localStorage.setItem('gemini_api_key', 'AIzaSyAAuHtqOKZVbRjy2GZh4IBNVDsYQhMb8B8');
            this.apiKey = 'AIzaSyAAuHtqOKZVbRjy2GZh4IBNVDsYQhMb8B8';
        }
    }

    showApiModal() {
        document.getElementById('apiModal').classList.remove('hidden');
    }

    hideApiModal() {
        document.getElementById('apiModal').classList.add('hidden');
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('Veuillez entrer une clé API valide');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        apiKeyInput.value = '';
        this.hideApiModal();
    }

    async generatePitch() {
        console.log('🚀 Début de la génération du pitch');
        
        if (!this.apiKey) {
            console.log('❌ Pas de clé API');
            this.showApiModal();
            return;
        }

        const formData = this.getFormData();
        console.log('📝 Données du formulaire:', formData);
        
        if (!this.validateForm(formData)) {
            console.log('❌ Validation du formulaire échouée');
            return;
        }

        this.showLoading(true);
        this.hideError();

        try {
            console.log('🔄 Appel à l\'API Gemini...');
            const pitch = await this.callGeminiAPI(formData);
            console.log('✅ Pitch généré:', pitch);
            this.displayPitch(pitch);
            this.currentPitch = pitch;
        } catch (error) {
            console.error('❌ Erreur lors de la génération:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    getFormData() {
        return {
            projectIdea: document.getElementById('projectIdea').value.trim(),
            targetMarket: document.getElementById('targetMarket').value.trim(),
            businessModel: document.getElementById('businessModel').value.trim(),
            competition: document.getElementById('competition').value.trim()
        };
    }

    getFieldLabel(field) {
        const labels = {
            projectIdea: 'Idée de projet',
            targetMarket: 'Marché cible',
            businessModel: 'Modèle économique',
            competition: 'Différenciation'
        };
        return labels[field] || field;
    }

    async callGeminiAPI(formData) {
        const prompt = this.buildPrompt(formData);
        console.log('📤 Prompt envoyé:', prompt.substring(0, 200) + '...');
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ]
        };
        
        console.log('📡 Requête API:', requestBody);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📡 Statut de la réponse:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erreur API:', errorData);
            
            let errorMessage = 'Erreur API';
            if (response.status === 400) {
                errorMessage = 'Clé API invalide ou requête malformée';
            } else if (response.status === 403) {
                errorMessage = 'Clé API invalide ou accès refusé';
            } else if (response.status === 429) {
                errorMessage = 'Limite de requêtes atteinte. Veuillez réessayer plus tard.';
            }
            
            throw new Error(`${errorMessage}: ${errorData.error?.message || 'Erreur inconnue'}`);
        }

        const data = await response.json();
        console.log('📥 Réponse API complète:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Structure de réponse invalide:', data);
            throw new Error('Réponse API invalide - pas de contenu généré');
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('📄 Texte généré:', generatedText);

        const parsedResponse = this.parsePitchResponse(generatedText);
        parsedResponse.raw_response = generatedText;
        return parsedResponse;
    }

    buildPrompt(formData) {
        return `Tu es un expert en business development et en pitch entrepreneurial. 
Basé sur les informations suivantes, génère un pitch structuré et professionnel selon la méthode Lean Canvas.

INFORMATIONS DU PROJET:
- Idée: ${formData.projectIdea}
- Marché cible: ${formData.targetMarket}  
- Modèle économique: ${formData.businessModel}
- Différenciation: ${formData.competition}

STRUCTURE DEMANDÉE (respecte exactement ce format):
## PROBLÈME
[Décris le problème principal que résout ce projet, en 2-3 phrases percutantes]

## SOLUTION
[Présente la solution de manière claire et concise, en expliquant comment elle résout le problème]

## CLIENT CIBLE
[Define précisément le segment de clientèle, leurs caractéristiques et besoins]

## PROPOSITION DE VALEUR
[Explique la valeur unique apportée et pourquoi choisir cette solution]

## CANAUX DE DISTRIBUTION
[Liste les principaux canaux pour atteindre et servir les clients]

## MODÈLE ÉCONOMIQUE
[Détaille comment l'entreprise génère ses revenus]

## AVANTAGE CONCURRENTIEL
[Explique ce qui différencie ce projet de la concurrence]

## MÉTRIQUES CLÉS
[Suggère 3-4 indicateurs importants à suivre]

Garde un ton professionnel mais accessible. Chaque section doit être concise (2-3 phrases max) mais impactante.`;
    }

    parsePitchResponse(response) {
        console.log('🔍 Parsing de la réponse:', response);
        
        const sections = {};
        const lines = response.split('\n');
        let currentSection = null;
        let currentContent = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('## ')) {
                // Sauvegarder la section précédente
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                
                // Commencer une nouvelle section
                currentSection = trimmedLine.replace('## ', '').toLowerCase().replace(/\s+/g, '_');
                currentContent = [];
            } else if (currentSection && trimmedLine) {
                currentContent.push(trimmedLine);
            }
        }
        
        // Sauvegarder la dernière section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        console.log('📊 Sections parsées:', sections);
        
        // Si aucune section n'a été trouvée, créer un fallback
        if (Object.keys(sections).length === 0) {
            console.log('⚠️ Aucune section trouvée, création d\'un fallback');
            return {
                'problème': 'Contenu généré par l\'IA disponible ci-dessous.',
                'solution': response.substring(0, 300) + '...',
                'client_cible': 'Voir le contenu complet généré par l\'IA.',
                'proposition_de_valeur': 'Pitch généré avec succès.',
                'canaux_de_distribution': 'Voir analyse complète.',
                'modèle_économique': 'Détails dans le contenu généré.',
                'avantage_concurrentiel': 'Voir recommandations IA.',
                'métriques_clés': 'Analyse disponible dans le contenu.'
            };
        }

        return sections;
    }

    displayPitch(pitch) {
        const pitchContent = document.getElementById('pitchContent');
        const sectionConfigs = [
            { key: 'problème', title: 'Problème identifié', icon: '🎯' },
            { key: 'solution', title: 'Solution proposée', icon: '💡' },
            { key: 'client_cible', title: 'Client cible', icon: '👥' },
            { key: 'proposition_de_valeur', title: 'Proposition de valeur', icon: '⭐' },
            { key: 'canaux_de_distribution', title: 'Canaux de distribution', icon: '📢' },
            { key: 'modèle_économique', title: 'Modèle économique', icon: '💰' },
            { key: 'avantage_concurrentiel', title: 'Avantage concurrentiel', icon: '🏆' },
            { key: 'métriques_clés', title: 'Métriques clés', icon: '📊' }
        ];

        let html = '';
        
        for (const config of sectionConfigs) {
            const content = pitch[config.key] || pitch[config.key.replace('_', ' ')] || 'Contenu non disponible';
            html += `
                <div class="pitch-section">
                    <h3>${config.icon} ${config.title}</h3>
                    <p>${this.formatContent(content)}</p>
                </div>
            `;
        }

        // Ajouter la section de réponse complète
        html += `
            <div class="pitch-section full-response" style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee;">
                <h3>📝 Réponse complète</h3>
                <div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">
                    ${pitch.raw_response || 'Réponse complète non disponible'}
                </div>
            </div>
        `;

        pitchContent.innerHTML = html;
        this.showResult();
    }

    formatContent(content) {
        // Convertir les listes à puces si détectées
        if (content.includes('•') || content.includes('-')) {
            const lines = content.split('\n');
            let formatted = '';
            let inList = false;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    if (!inList) {
                        formatted += '<ul>';
                        inList = true;
                    }
                    formatted += `<li>${trimmed.substring(1).trim()}</li>`;
                } else {
                    if (inList) {
                        formatted += '</ul>';
                        inList = false;
                    }
                    if (trimmed) {
                        formatted += `<p>${trimmed}</p>`;
                    }
                }
            }
            
            if (inList) {
                formatted += '</ul>';
            }
            
            return formatted;
        }
        
        return content.replace(/\n/g, '<br>');
    }

    showResult() {
        document.getElementById('formSection').classList.add('hidden');
        document.getElementById('resultSection').classList.remove('hidden');
        
        // Scroll vers le résultat
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    editPitch() {
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('formSection').classList.remove('hidden');
        
        // Scroll vers le formulaire
        document.getElementById('formSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    async sharePitch() {
        if (!this.currentPitch) return;

        const pitchText = this.generateShareText();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mon Pitch Business',
                    text: pitchText,
                });
            } catch (error) {
                this.fallbackShare(pitchText);
            }
        } else {
            this.fallbackShare(pitchText);
        }
    }

    fallbackShare(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Pitch copié dans le presse-papiers !');
        }).catch(() => {
            // Fallback pour navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('✅ Pitch copié dans le presse-papiers !');
            } catch (err) {
                alert('❌ Impossible de copier le texte. Veuillez le sélectionner manuellement.');
            }
            document.body.removeChild(textArea);
        });
    }

    generateShareText() {
        if (!this.currentPitch) return '';
        
        let text = '🚀 MON PITCH BUSINESS\n\n';
        
        const sections = [
            { key: 'problème', title: '🎯 PROBLÈME' },
            { key: 'solution', title: '💡 SOLUTION' },
            { key: 'client_cible', title: '👥 CLIENT CIBLE' },
            { key: 'proposition_de_valeur', title: '⭐ PROPOSITION DE VALEUR' }
        ];

        for (const section of sections) {
            const content = this.currentPitch[section.key] || this.currentPitch[section.key.replace('_', ' ')];
            if (content) {
                text += `${section.title}\n${content}\n\n`;
            }
        }
        
        text += '---\nGénéré avec Pitch Generator IA';
        
        return text;
    }

    exportToPDF() {
        if (!this.currentPitch) return;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuration
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - 2 * margin;
            let yPosition = 30;
            
            // Titre
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('PITCH BUSINESS', margin, yPosition);
            yPosition += 20;
            
            // Date
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
            yPosition += 20;

            // Sections
            const sections = [
                { key: 'problème', title: 'PROBLÈME IDENTIFIÉ', icon: '🎯' },
                { key: 'solution', title: 'SOLUTION PROPOSÉE', icon: '💡' },
                { key: 'client_cible', title: 'CLIENT CIBLE', icon: '👥' },
                { key: 'proposition_de_valeur', title: 'PROPOSITION DE VALEUR', icon: '⭐' },
                { key: 'canaux_de_distribution', title: 'CANAUX DE DISTRIBUTION', icon: '📢' },
                { key: 'modèle_économique', title: 'MODÈLE ÉCONOMIQUE', icon: '💰' },
                { key: 'avantage_concurrentiel', title: 'AVANTAGE CONCURRENTIEL', icon: '🏆' },
                { key: 'métriques_clés', title: 'MÉTRIQUES CLÉS', icon: '📊' }
            ];

            for (const section of sections) {
                const content = this.currentPitch[section.key] || this.currentPitch[section.key.replace('_', ' ')];
                if (content) {
                    // Vérifier si on a assez de place
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 30;
                    }
                    
                    // Titre de section
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    doc.text(`${section.icon} ${section.title}`, margin, yPosition);
                    yPosition += 10;
                    
                    // Contenu
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'normal');
                    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
                    const lines = doc.splitTextToSize(cleanContent, maxWidth);
                    
                    for (const line of lines) {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 30;
                        }
                        doc.text(line, margin, yPosition);
                        yPosition += 7;
                    }
                    yPosition += 10;
                }
            }
            
            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    'Généré avec Pitch Generator IA',
                    margin,
                    doc.internal.pageSize.getHeight() - 10
                );
                doc.text(
                    `Page ${i} sur ${totalPages}`,
                    pageWidth - margin - 30,
                    doc.internal.pageSize.getHeight() - 10
                );
            }
            
            // Télécharger
            const fileName = `pitch-business-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            alert('❌ Erreur lors de l\'export PDF. Veuillez réessayer.');
        }
    }

    showLoading(show) {
        const btnText = document.getElementById('btnText');
        const loader = document.getElementById('loader');
        const generateBtn = document.getElementById('generateBtn');
        
        if (show) {
            btnText.textContent = 'Génération en cours...';
            loader.classList.remove('hidden');
            generateBtn.disabled = true;
        } else {
            btnText.textContent = 'Générer mon pitch';
            loader.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    showError(message = null) {
        const errorElement = document.getElementById('errorMessage');
        if (message) {
            errorElement.innerHTML = `<p>⚠️ ${message}</p>`;
        }
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            this.hideError();
        }, 8000);
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    generateTestPitch() {
        console.log('🧪 Génération d\'un pitch de test');
        
        const formData = this.getFormData();
        if (!this.validateForm(formData)) {
            return;
        }

        this.showLoading(true);
        
        // Simuler un délai d'API
        setTimeout(() => {
            const testPitch = {
                'problème': `Le marché ciblé (${formData.targetMarket}) fait face à des défis significatifs qui ne sont pas correctement adressés par les solutions actuelles. Ces problèmes créent des frustrations et des inefficacités.`,
                'solution': `Notre solution "${formData.projectIdea}" propose une approche innovante qui résout directement ces problèmes grâce à une technologie moderne et une expérience utilisateur optimisée.`,
                'client_cible': `Notre segment principal comprend ${formData.targetMarket}, caractérisés par leurs besoins spécifiques et leur volonté d'adopter des solutions innovantes.`,
                'proposition_de_valeur': `${formData.competition} Cette différenciation nous permet de créer une valeur unique et d'établir un avantage concurrentiel durable.`,
                'canaux_de_distribution': 'Applications mobiles, plateformes web, partenariats stratégiques, marketing digital ciblé, et recommandations clients.',
                'modèle_économique': `${formData.businessModel} Ce modèle assure une croissance durable et une rentabilité à long terme.`,
                'avantage_concurrentiel': `${formData.competition} Cette approche unique nous positionne favorablement face à la concurrence existante.`,
                'métriques_clés': 'Acquisition clients, taux de rétention, revenus récurrents mensuels (MRR), satisfaction client (NPS), et part de marché.'
            };
            
            this.displayPitch(testPitch);
            this.currentPitch = testPitch;
            this.showLoading(false);
            
            console.log('✅ Pitch de test généré avec succès');
        }, 2000);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new PitchGenerator();
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
});

// Service Worker pour PWA (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            console.log('SW registered: ', registration);
        }).catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}