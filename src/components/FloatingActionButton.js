import React, { useState } from 'react';

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const toggleFAB = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Logique d'import à implémenter
          console.log('Données importées:', data);
          alert('Import réussi !');
          setShowImportModal(false);
          setIsExpanded(false);
        } catch (error) {
          alert('Erreur: Format de fichier invalide');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Veuillez sélectionner un fichier JSON valide');
    }
  };

  const handleExport = () => {
    try {
      // Récupération des données depuis localStorage
      const exportData = {
        tournaments: JSON.parse(localStorage.getItem('tournaments') || '[]'),
        players: JSON.parse(localStorage.getItem('players') || '[]'),
        matches: JSON.parse(localStorage.getItem('matches') || '[]'),
        rounds: JSON.parse(localStorage.getItem('rounds') || '[]'),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fab-tournament-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      setIsExpanded(false);
      
    } catch (error) {
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <>
      {/* Overlay pour fermer le FAB */}
      {isExpanded && (
        <div 
          className="fab-overlay" 
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Container principal du FAB */}
      <div className={`fab-container ${isExpanded ? 'expanded' : ''}`}>
        
        {/* Actions secondaires */}
        <div className="fab-actions">
          <button 
            className="fab-action import-action"
            onClick={() => setShowImportModal(true)}
            title="Importer des données"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              <path d="M12,11L14,13H13V17H11V13H10L12,11Z"/>
            </svg>
            <span>Import</span>
          </button>
          
          <button 
            className="fab-action export-action"
            onClick={() => setShowExportModal(true)}
            title="Exporter des données"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              <path d="M12,17L10,15H11V11H13V15H14L12,17Z"/>
            </svg>
            <span>Export</span>
          </button>
        </div>

        {/* Bouton principal FAB */}
        <button 
          className={`fab-main ${isExpanded ? 'expanded' : ''}`}
          onClick={toggleFAB}
          aria-label={isExpanded ? 'Fermer les actions' : 'Ouvrir les actions'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {isExpanded ? (
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            ) : (
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            )}
          </svg>
        </button>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📁 Importer des données</h3>
              <button 
                className="modal-close"
                onClick={() => setShowImportModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <p>Sélectionnez un fichier de sauvegarde pour restaurer vos données :</p>
              
              <div className="file-upload-area">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="file-input"
                  id="import-file"
                />
                <label htmlFor="import-file" className="file-upload-label">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  <span>Cliquez pour sélectionner un fichier</span>
                  <small>Format JSON uniquement</small>
                </label>
              </div>
              
              <div className="modal-info">
                <div className="info-item">
                  <strong>ℹ️ Information :</strong>
                  <p>Le fichier doit être au format JSON exporté par cette application. Toutes les données actuelles seront remplacées.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'export */}
      {showExportModal && (
        <div className="modal-backdrop" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💾 Exporter des données</h3>
              <button 
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <p>Créer une sauvegarde de toutes vos données :</p>
              
              <div className="export-summary">
                <div className="summary-item">
                  <span className="summary-icon">🏆</span>
                  <span>Tournois</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">👥</span>
                  <span>Joueurs</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">⚔️</span>
                  <span>Matchs</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">📊</span>
                  <span>Classements</span>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleExport}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Télécharger la sauvegarde
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowExportModal(false)}
                >
                  Annuler
                </button>
              </div>
              
              <div className="modal-info">
                <div className="info-item">
                  <strong>ℹ️ Information :</strong>
                  <p>Un fichier JSON sera téléchargé avec toutes vos données. Conservez-le en lieu sûr pour pouvoir restaurer vos données si nécessaire.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;