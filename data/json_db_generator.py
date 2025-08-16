import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import json
import urllib.parse
from datetime import datetime
import pyperclip  # Pour copier dans le presse-papiers (pip install pyperclip)

class JSONDatabaseGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("Générateur de Base de Données JSON")
        self.root.geometry("1000x700")
        self.root.configure(bg='#f0f0f0')
        
        # Liste pour stocker temporairement les éléments
        self.temp_database = []
        
        # Configuration WhatsApp par défaut
        self.whatsapp_number = tk.StringVar(value="24177067949")
        
        self.create_widgets()
        
    def create_widgets(self):
        # Frame principal avec scrollbar
        main_canvas = tk.Canvas(self.root, bg='#f0f0f0')
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=main_canvas.yview)
        scrollable_frame = ttk.Frame(main_canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: main_canvas.configure(scrollregion=main_canvas.bbox("all"))
        )
        
        main_canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        main_canvas.configure(yscrollcommand=scrollbar.set)
        
        main_canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Configuration générale
        config_frame = ttk.LabelFrame(scrollable_frame, text="Configuration WhatsApp", padding="10")
        config_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(config_frame, text="Numéro WhatsApp (avec code pays):").pack(anchor=tk.W)
        ttk.Entry(config_frame, textvariable=self.whatsapp_number, width=20).pack(anchor=tk.W, pady=(0, 5))
        
        # Section de saisie des données
        entry_frame = ttk.LabelFrame(scrollable_frame, text="Ajouter un nouvel élément", padding="10")
        entry_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Variables pour les champs
        self.categorie_var = tk.StringVar()
        self.nom_var = tk.StringVar()
        self.prix_var = tk.StringVar()
        self.image_var = tk.StringVar()
        self.etat_var = tk.StringVar(value="Disponible")
        
        # Catégorie
        ttk.Label(entry_frame, text="Catégorie:").grid(row=0, column=0, sticky=tk.W, pady=2)
        categorie_combo = ttk.Combobox(entry_frame, textvariable=self.categorie_var, width=30)
        categorie_combo['values'] = ('vetement', 'accessoire', 'chaussure', 'sac', 'bijou', 'electronique', 'autre')
        categorie_combo.grid(row=0, column=1, sticky=tk.W, padx=(10, 0), pady=2)
        categorie_combo.set('vetement')
        
        # Nom du produit
        ttk.Label(entry_frame, text="Nom du produit:").grid(row=1, column=0, sticky=tk.W, pady=2)
        ttk.Entry(entry_frame, textvariable=self.nom_var, width=35).grid(row=1, column=1, sticky=tk.W, padx=(10, 0), pady=2)
        
        # Prix
        ttk.Label(entry_frame, text="Prix:").grid(row=2, column=0, sticky=tk.W, pady=2)
        prix_frame = ttk.Frame(entry_frame)
        prix_frame.grid(row=2, column=1, sticky=tk.W, padx=(10, 0), pady=2)
        ttk.Entry(prix_frame, textvariable=self.prix_var, width=15).pack(side=tk.LEFT)
        ttk.Label(prix_frame, text="FCFA").pack(side=tk.LEFT, padx=(5, 0))
        
        # Image
        ttk.Label(entry_frame, text="Chemin de l'image:").grid(row=3, column=0, sticky=tk.W, pady=2)
        image_frame = ttk.Frame(entry_frame)
        image_frame.grid(row=3, column=1, sticky=tk.W, padx=(10, 0), pady=2)
        ttk.Entry(image_frame, textvariable=self.image_var, width=25).pack(side=tk.LEFT)
        ttk.Button(image_frame, text="Parcourir", command=self.browse_image).pack(side=tk.LEFT, padx=(5, 0))
        
        # État
        ttk.Label(entry_frame, text="État:").grid(row=4, column=0, sticky=tk.W, pady=2)
        etat_combo = ttk.Combobox(entry_frame, textvariable=self.etat_var, width=30)
        etat_combo['values'] = ('Disponible', 'NonDisponible')
        etat_combo.grid(row=4, column=1, sticky=tk.W, padx=(10, 0), pady=2)
        etat_combo.state(['readonly'])
        
        # Boutons d'action pour l'ajout
        button_frame = ttk.Frame(entry_frame)
        button_frame.grid(row=5, column=0, columnspan=2, pady=10)
        
        ttk.Button(button_frame, text="Ajouter à la liste", command=self.add_item).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Effacer les champs", command=self.clear_fields).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="Aperçu JSON", command=self.preview_json).pack(side=tk.LEFT)
        
        # Section de gestion de la liste temporaire
        list_frame = ttk.LabelFrame(scrollable_frame, text="Liste temporaire des éléments", padding="10")
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Listbox avec scrollbar
        list_container = ttk.Frame(list_frame)
        list_container.pack(fill=tk.BOTH, expand=True)
        
        self.listbox = tk.Listbox(list_container, height=8, font=('Arial', 10))
        list_scrollbar = ttk.Scrollbar(list_container, orient="vertical", command=self.listbox.yview)
        self.listbox.configure(yscrollcommand=list_scrollbar.set)
        
        self.listbox.pack(side="left", fill="both", expand=True)
        list_scrollbar.pack(side="right", fill="y")
        
        # Boutons pour gérer la liste
        list_buttons_frame = ttk.Frame(list_frame)
        list_buttons_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(list_buttons_frame, text="Modifier l'élément sélectionné", command=self.edit_selected_item).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(list_buttons_frame, text="Supprimer l'élément sélectionné", command=self.delete_selected_item).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(list_buttons_frame, text="Vider la liste", command=self.clear_list).pack(side=tk.LEFT, padx=(0, 5))
        
        # Section d'exportation
        export_frame = ttk.LabelFrame(scrollable_frame, text="Exportation", padding="10")
        export_frame.pack(fill=tk.X, padx=10, pady=5)
        
        export_buttons_frame = ttk.Frame(export_frame)
        export_buttons_frame.pack(fill=tk.X)
        
        ttk.Button(export_buttons_frame, text="Copier JSON dans le presse-papiers", command=self.copy_to_clipboard).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(export_buttons_frame, text="Télécharger JSON", command=self.download_json).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(export_buttons_frame, text="Charger JSON existant", command=self.load_json).pack(side=tk.LEFT)
        
        # Compteur d'éléments
        self.count_var = tk.StringVar(value="0 éléments dans la liste")
        ttk.Label(export_frame, textvariable=self.count_var).pack(pady=(10, 0))
        
        # Zone d'aperçu JSON
        preview_frame = ttk.LabelFrame(scrollable_frame, text="Aperçu JSON", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        self.preview_text = scrolledtext.ScrolledText(
            preview_frame,
            height=10,
            wrap=tk.WORD,
            font=('Courier New', 10)
        )
        self.preview_text.pack(fill=tk.BOTH, expand=True)
        
        # Bind pour la sélection dans la listbox
        self.listbox.bind('<<ListboxSelect>>', self.on_select)
        
        # Bind pour la molette de souris
        def _on_mousewheel(event):
            main_canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        main_canvas.bind("<MouseWheel>", _on_mousewheel)
        
    def browse_image(self):
        file_path = filedialog.askopenfilename(
            title="Sélectionner une image",
            filetypes=[
                ("Images", "*.png *.jpg *.jpeg *.gif *.bmp"),
                ("Tous les fichiers", "*.*")
            ]
        )
        if file_path:
            # Convertir en chemin relatif si possible
            try:
                relative_path = "images/" + file_path.split('/')[-1]
                self.image_var.set(relative_path)
            except:
                self.image_var.set(file_path)
    
    def generate_whatsapp_link(self, nom, prix):
        """Génère le lien WhatsApp avec le message pré-rempli"""
        message = f"Je veux commander {nom} {prix}"
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{self.whatsapp_number.get()}?text={encoded_message}"
    
    def add_item(self):
        """Ajoute un nouvel élément à la liste temporaire"""
        # Validation des champs obligatoires
        if not self.nom_var.get().strip():
            messagebox.showwarning("Attention", "Le nom du produit est obligatoire.")
            return
        
        if not self.prix_var.get().strip():
            messagebox.showwarning("Attention", "Le prix est obligatoire.")
            return
        
        # Formatage du prix
        prix_formate = f"{self.prix_var.get().strip()} FCFA"
        
        # Création de l'élément JSON
        item = {
            "categorie": self.categorie_var.get() or "vetement",
            "nom": self.nom_var.get().strip(),
            "prix": prix_formate,
            "image": self.image_var.get().strip() or "images/default.jpg",
            "lienWhatsapp": self.generate_whatsapp_link(self.nom_var.get().strip(), prix_formate),
            "Etat": self.etat_var.get()
        }
        
        # Ajout à la liste temporaire
        self.temp_database.append(item)
        
        # Mise à jour de l'affichage
        self.update_listbox()
        self.clear_fields()
        self.update_preview()
        
        messagebox.showinfo("Succès", "Élément ajouté à la liste temporaire.")
    
    def clear_fields(self):
        """Efface tous les champs de saisie"""
        self.nom_var.set("")
        self.prix_var.set("")
        self.image_var.set("")
        self.etat_var.set("Disponible")
        # Garde la catégorie pour faciliter la saisie multiple
    
    def update_listbox(self):
        """Met à jour l'affichage de la listbox"""
        self.listbox.delete(0, tk.END)
        for i, item in enumerate(self.temp_database):
            display_text = f"{i+1}. {item['nom']} - {item['prix']} ({item['Etat']})"
            self.listbox.insert(tk.END, display_text)
        
        self.count_var.set(f"{len(self.temp_database)} éléments dans la liste")
    
    def update_preview(self):
        """Met à jour l'aperçu JSON"""
        self.preview_text.delete(1.0, tk.END)
        if self.temp_database:
            json_text = json.dumps(self.temp_database, indent=2, ensure_ascii=False)
            self.preview_text.insert(1.0, json_text)
        else:
            self.preview_text.insert(1.0, "Aucun élément dans la liste")
    
    def on_select(self, event):
        """Gestion de la sélection dans la listbox"""
        pass  # Placeholder pour futures fonctionnalités
    
    def edit_selected_item(self):
        """Modifie l'élément sélectionné dans la listbox"""
        selection = self.listbox.curselection()
        if not selection:
            messagebox.showwarning("Attention", "Veuillez sélectionner un élément à modifier.")
            return
        
        index = selection[0]
        item = self.temp_database[index]
        
        # Remplir les champs avec les données existantes
        self.categorie_var.set(item['categorie'])
        self.nom_var.set(item['nom'])
        # Extraire le prix sans "FCFA"
        prix_clean = item['prix'].replace(' FCFA', '')
        self.prix_var.set(prix_clean)
        self.image_var.set(item['image'])
        self.etat_var.set(item['Etat'])
        
        # Supprimer l'ancien élément
        del self.temp_database[index]
        self.update_listbox()
        self.update_preview()
        
        messagebox.showinfo("Information", "Élément chargé pour modification. Cliquez sur 'Ajouter à la liste' pour confirmer les modifications.")
    
    def delete_selected_item(self):
        """Supprime l'élément sélectionné de la liste"""
        selection = self.listbox.curselection()
        if not selection:
            messagebox.showwarning("Attention", "Veuillez sélectionner un élément à supprimer.")
            return
        
        index = selection[0]
        item_name = self.temp_database[index]['nom']
        
        if messagebox.askyesno("Confirmation", f"Voulez-vous vraiment supprimer '{item_name}' ?"):
            del self.temp_database[index]
            self.update_listbox()
            self.update_preview()
            messagebox.showinfo("Succès", "Élément supprimé.")
    
    def clear_list(self):
        """Vide complètement la liste temporaire"""
        if not self.temp_database:
            messagebox.showinfo("Information", "La liste est déjà vide.")
            return
        
        if messagebox.askyesno("Confirmation", "Voulez-vous vraiment vider toute la liste ?"):
            self.temp_database.clear()
            self.update_listbox()
            self.update_preview()
            messagebox.showinfo("Succès", "Liste vidée.")
    
    def preview_json(self):
        """Affiche un aperçu JSON du dernier élément ajouté"""
        if not self.nom_var.get().strip():
            messagebox.showwarning("Attention", "Veuillez remplir au moins le nom du produit pour l'aperçu.")
            return
        
        # Créer un élément temporaire pour l'aperçu
        prix_formate = f"{self.prix_var.get().strip() or '0'} FCFA"
        temp_item = {
            "categorie": self.categorie_var.get() or "vetement",
            "nom": self.nom_var.get().strip(),
            "prix": prix_formate,
            "image": self.image_var.get().strip() or "images/default.jpg",
            "lienWhatsapp": self.generate_whatsapp_link(self.nom_var.get().strip(), prix_formate),
            "Etat": self.etat_var.get()
        }
        
        # Afficher dans une nouvelle fenêtre
        preview_window = tk.Toplevel(self.root)
        preview_window.title("Aperçu JSON de l'élément actuel")
        preview_window.geometry("600x400")
        
        text_widget = scrolledtext.ScrolledText(
            preview_window,
            wrap=tk.WORD,
            font=('Courier New', 11)
        )
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        json_text = json.dumps(temp_item, indent=2, ensure_ascii=False)
        text_widget.insert(1.0, json_text)
        text_widget.config(state=tk.DISABLED)
    
    def copy_to_clipboard(self):
        """Copie le JSON dans le presse-papiers"""
        if not self.temp_database:
            messagebox.showwarning("Attention", "Aucun élément à copier.")
            return
        
        try:
            json_text = json.dumps(self.temp_database, indent=2, ensure_ascii=False)
            pyperclip.copy(json_text)
            messagebox.showinfo("Succès", "JSON copié dans le presse-papiers !")
        except ImportError:
            # Si pyperclip n'est pas installé, utiliser tkinter
            self.root.clipboard_clear()
            json_text = json.dumps(self.temp_database, indent=2, ensure_ascii=False)
            self.root.clipboard_append(json_text)
            messagebox.showinfo("Succès", "JSON copié dans le presse-papiers !")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur lors de la copie: {str(e)}")
    
    def download_json(self):
        """Télécharge le JSON dans un fichier"""
        if not self.temp_database:
            messagebox.showwarning("Attention", "Aucun élément à télécharger.")
            return
        
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("Fichiers JSON", "*.json"), ("Tous les fichiers", "*.*")],
            title="Enregistrer la base de données JSON",
            initialname=f"database_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(self.temp_database, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Succès", f"Base de données sauvegardée dans:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde:\n{str(e)}")
    
    def load_json(self):
        """Charge un fichier JSON existant"""
        file_path = filedialog.askopenfilename(
            filetypes=[("Fichiers JSON", "*.json"), ("Tous les fichiers", "*.*")],
            title="Charger une base de données JSON"
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                
                # Vérifier que c'est une liste
                if not isinstance(loaded_data, list):
                    messagebox.showerror("Erreur", "Le fichier JSON doit contenir une liste d'éléments.")
                    return
                
                # Vérifier la structure des éléments
                required_keys = ["categorie", "nom", "prix", "image", "lienWhatsapp", "Etat"]
                for item in loaded_data:
                    if not all(key in item for key in required_keys):
                        if not messagebox.askyesno("Attention", 
                            "Certains éléments ne respectent pas la structure attendue. Voulez-vous continuer ?"):
                            return
                        break
                
                # Demander si on doit remplacer ou ajouter
                if self.temp_database:
                    choice = messagebox.askyesnocancel(
                        "Chargement", 
                        "Voulez-vous remplacer la liste actuelle ?\n\n"
                        "Oui = Remplacer\n"
                        "Non = Ajouter à la liste actuelle\n"
                        "Annuler = Annuler l'opération"
                    )
                    if choice is None:  # Annuler
                        return
                    elif choice:  # Remplacer
                        self.temp_database = loaded_data
                    else:  # Ajouter
                        self.temp_database.extend(loaded_data)
                else:
                    self.temp_database = loaded_data
                
                self.update_listbox()
                self.update_preview()
                messagebox.showinfo("Succès", f"{len(loaded_data)} éléments chargés avec succès !")
                
            except json.JSONDecodeError:
                messagebox.showerror("Erreur", "Fichier JSON invalide.")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors du chargement:\n{str(e)}")

def main():
    root = tk.Tk()
    app = JSONDatabaseGenerator(root)
    root.mainloop()

if __name__ == "__main__":
    main()
