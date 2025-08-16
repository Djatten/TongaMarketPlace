import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import json
import os
from datetime import datetime
import urllib.parse

class JSONDatabaseGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("Générateur d'éléments pour Base de Données JSON")
        self.root.geometry("900x700")
        self.root.configure(bg='#f0f0f0')
        
        # Structure JSON par défaut
        self.json_structure = {
            "categorie": "",
            "nom": "",
            "prix": "",
            "image": "",
            "lienWhatsapp": "",
            "Etat": "Disponible",
            "boutique": ""  # Ajout du champ boutique
        }
        
        # Liste des produits créés
        self.products_list = []
        
        # Numéro WhatsApp par défaut
        self.whatsapp_number = "24177067949"
        
        self.create_widgets()
        
    def create_widgets(self):
        # Frame principal avec scrollbar
        canvas = tk.Canvas(self.root)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Configuration du frame principal
        main_frame = ttk.Frame(scrollable_frame, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Titre
        title_label = ttk.Label(main_frame, text="Générateur d'éléments JSON", font=('Arial', 16, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Configuration WhatsApp
        self.create_whatsapp_section(main_frame)
        
        # Formulaire de saisie
        self.create_form_section(main_frame)
        
        # Boutons d'action
        self.create_action_buttons(main_frame)
        
        # Section de prévisualisation
        self.create_preview_section(main_frame)
        
        # Liste des produits créés
        self.create_products_list_section(main_frame)
        
        # Pack canvas et scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
    def create_whatsapp_section(self, parent):
        # Configuration WhatsApp
        whatsapp_frame = ttk.LabelFrame(parent, text="Configuration WhatsApp", padding="10")
        whatsapp_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(whatsapp_frame, text="Numéro WhatsApp (avec indicatif pays):").pack(anchor=tk.W)
        self.whatsapp_entry = ttk.Entry(whatsapp_frame, width=30)
        self.whatsapp_entry.insert(0, self.whatsapp_number)
        self.whatsapp_entry.pack(anchor=tk.W, pady=(5, 0))
        
    def create_form_section(self, parent):
        # Frame du formulaire
        form_frame = ttk.LabelFrame(parent, text="Informations du produit", padding="15")
        form_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Variables pour les entrées
        self.form_vars = {}
        self.form_entries = {}
        
        # Catégorie avec combobox
        ttk.Label(form_frame, text="Catégorie *", font=('Arial', 10, 'bold')).grid(row=0, column=0, sticky=tk.W, pady=(0, 5))
        self.form_vars['categorie'] = tk.StringVar()
        categories = ["vetement", "accessoire", "chaussure", "sac", "bijou", "electronique", "maison", "sport", "autre"]
        self.category_combo = ttk.Combobox(form_frame, textvariable=self.form_vars['categorie'], values=categories, width=40)
        self.category_combo.grid(row=0, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        # Nom du produit
        ttk.Label(form_frame, text="Nom du produit *", font=('Arial', 10, 'bold')).grid(row=1, column=0, sticky=tk.W, pady=(0, 5))
        self.form_vars['nom'] = tk.StringVar()
        self.form_entries['nom'] = ttk.Entry(form_frame, textvariable=self.form_vars['nom'], width=43)
        self.form_entries['nom'].grid(row=1, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        # Boutique
        ttk.Label(form_frame, text="Boutique", font=('Arial', 10, 'bold')).grid(row=2, column=0, sticky=tk.W, pady=(0, 5))
        self.form_vars['boutique'] = tk.StringVar()
        self.form_entries['boutique'] = ttk.Entry(form_frame, textvariable=self.form_vars['boutique'], width=43)
        self.form_entries['boutique'].grid(row=2, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        # Prix
        ttk.Label(form_frame, text="Prix *", font=('Arial', 10, 'bold')).grid(row=3, column=0, sticky=tk.W, pady=(0, 5))
        self.form_vars['prix'] = tk.StringVar()
        prix_frame = ttk.Frame(form_frame)
        prix_frame.grid(row=3, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        self.form_entries['prix'] = ttk.Entry(prix_frame, textvariable=self.form_vars['prix'], width=20)
        self.form_entries['prix'].pack(side=tk.LEFT)
        ttk.Label(prix_frame, text=" FCFA").pack(side=tk.LEFT, padx=(5, 0))
        
        # Image
        ttk.Label(form_frame, text="Chemin de l'image *", font=('Arial', 10, 'bold')).grid(row=4, column=0, sticky=tk.W, pady=(0, 5))
        image_frame = ttk.Frame(form_frame)
        image_frame.grid(row=4, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        self.form_vars['image'] = tk.StringVar()
        self.form_entries['image'] = ttk.Entry(image_frame, textvariable=self.form_vars['image'], width=30)
        self.form_entries['image'].pack(side=tk.LEFT)
        ttk.Button(image_frame, text="Parcourir", command=self.browse_image).pack(side=tk.LEFT, padx=(5, 0))
        
        # État
        ttk.Label(form_frame, text="État *", font=('Arial', 10, 'bold')).grid(row=5, column=0, sticky=tk.W, pady=(0, 5))
        self.form_vars['Etat'] = tk.StringVar(value="Disponible")
        etat_frame = ttk.Frame(form_frame)
        etat_frame.grid(row=5, column=1, sticky=tk.W, pady=(0, 10), padx=(10, 0))
        
        ttk.Radiobutton(etat_frame, text="Disponible", variable=self.form_vars['Etat'], value="Disponible").pack(side=tk.LEFT)
        ttk.Radiobutton(etat_frame, text="Non Disponible", variable=self.form_vars['Etat'], value="NonDisponible").pack(side=tk.LEFT, padx=(15, 0))
        
        # Instructions
        instruction_label = ttk.Label(form_frame, text="* Champs obligatoires", font=('Arial', 8), foreground='red')
        instruction_label.grid(row=6, column=0, columnspan=2, sticky=tk.W, pady=(10, 0))
        
    def create_action_buttons(self, parent):
        # Boutons d'action
        button_frame = ttk.Frame(parent)
        button_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Button(button_frame, text="Générer Élément JSON", command=self.generate_json_element, style='Accent.TButton').pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Ajouter à la liste", command=self.add_to_list).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Effacer le formulaire", command=self.clear_form).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Sauvegarder JSON", command=self.save_json).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(button_frame, text="Charger JSON", command=self.load_json).pack(side=tk.LEFT)
        
    def create_preview_section(self, parent):
        # Section de prévisualisation
        preview_frame = ttk.LabelFrame(parent, text="Prévisualisation JSON", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 15))
        
        self.preview_text = scrolledtext.ScrolledText(
            preview_frame,
            height=8,
            wrap=tk.WORD,
            font=('Consolas', 10)
        )
        self.preview_text.pack(fill=tk.BOTH, expand=True)
        
        # Boutons pour la prévisualisation
        preview_button_frame = ttk.Frame(preview_frame)
        preview_button_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(preview_button_frame, text="Copier JSON", command=self.copy_json).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(preview_button_frame, text="Tester lien WhatsApp", command=self.test_whatsapp_link).pack(side=tk.LEFT)
        
    def create_products_list_section(self, parent):
        # Liste des produits créés
        list_frame = ttk.LabelFrame(parent, text="Produits créés", padding="10")
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        # Treeview pour afficher les produits
        columns = ('Nom', 'Catégorie', 'Prix', 'État')
        self.products_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=6)
        
        for col in columns:
            self.products_tree.heading(col, text=col)
            self.products_tree.column(col, width=120)
            
        self.products_tree.pack(fill=tk.BOTH, expand=True)
        
        # Scrollbar pour le Treeview
        tree_scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.products_tree.yview)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.products_tree.configure(yscrollcommand=tree_scroll.set)
        
        # Boutons pour la liste
        list_button_frame = ttk.Frame(list_frame)
        list_button_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(list_button_frame, text="Supprimer sélectionné", command=self.delete_selected_product).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(list_button_frame, text="Modifier sélectionné", command=self.edit_selected_product).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(list_button_frame, text="Vider la liste", command=self.clear_products_list).pack(side=tk.LEFT)
        
    def browse_image(self):
        file_path = filedialog.askopenfilename(
            title="Sélectionner une image",
            filetypes=[
                ("Images", "*.jpg *.jpeg *.png *.gif *.bmp"),
                ("Tous les fichiers", "*.*")
            ]
        )
        if file_path:
            # Convertir en chemin relatif si possible
            try:
                rel_path = os.path.relpath(file_path)
                if not rel_path.startswith('..'):
                    file_path = rel_path
            except ValueError:
                pass
            # Ajout du préfixe ../asset/ si ce n'est pas déjà présent
            asset_prefix = "../asset/"
            filename = os.path.basename(file_path)
            if not file_path.startswith(asset_prefix):
                file_path = asset_prefix + filename
            self.form_vars['image'].set(file_path)
            
    def generate_whatsapp_link(self, product_name, prix):
        """Génère le lien WhatsApp avec le nom du produit et le prix"""
        whatsapp_number = self.whatsapp_entry.get().strip()
        if not whatsapp_number:
            whatsapp_number = self.whatsapp_number
            
        # Encoder le nom du produit pour l'URL
        encoded_product_name = urllib.parse.quote(product_name)
        encoded_prix = urllib.parse.quote(prix)
        message = f"Je veux commender {encoded_product_name} {encoded_prix}"
        
        return f"https://wa.me/{whatsapp_number}?text={message}"
        
    def generate_json_element(self):
        """Génère l'élément JSON avec les données du formulaire"""
        # Validation des champs obligatoires
        required_fields = ['categorie', 'nom', 'prix', 'image']
        for field in required_fields:
            if field in self.form_vars and not self.form_vars[field].get().strip():
                messagebox.showerror("Erreur", f"Le champ '{field}' est obligatoire.")
                return
                
        # Créer l'élément JSON
        element = {}
        element['categorie'] = self.form_vars['categorie'].get().strip()
        element['nom'] = self.form_vars['nom'].get().strip()
        element['boutique'] = self.form_vars['boutique'].get().strip()  # Ajout du champ boutique
        
        # Formater le prix
        prix = self.form_vars['prix'].get().strip()
        if not prix.endswith(' FCFA'):
            prix += ' FCFA'
        element['prix'] = prix
        element['image'] = self.form_vars['image'].get().strip()
        element['lienWhatsapp'] = self.generate_whatsapp_link(element['nom'], element['prix'])
        element['Etat'] = self.form_vars['Etat'].get()
        element['Etat'] = self.form_vars['Etat'].get()
        
        # Afficher dans la prévisualisation
        json_formatted = json.dumps(element, indent=2, ensure_ascii=False)
        self.preview_text.delete(1.0, tk.END)
        self.preview_text.insert(1.0, json_formatted)
        
        messagebox.showinfo("Succès", "Élément JSON généré avec succès!")
        
    def add_to_list(self):
        """Ajoute l'élément actuel à la liste des produits"""
        self.generate_json_element()  # Générer d'abord
        
        if self.preview_text.get(1.0, tk.END).strip():
            try:
                # Parse le JSON de la prévisualisation
                json_data = json.loads(self.preview_text.get(1.0, tk.END))
                
                # Ajouter à la liste
                self.products_list.append(json_data)
                
                # Mettre à jour l'affichage
                self.update_products_display()
                
                messagebox.showinfo("Succès", "Produit ajouté à la liste!")
                
            except json.JSONDecodeError:
                messagebox.showerror("Erreur", "Format JSON invalide.")
                
    def update_products_display(self):
        """Met à jour l'affichage de la liste des produits"""
        # Vider le Treeview
        for item in self.products_tree.get_children():
            self.products_tree.delete(item)
            
        # Ajouter les produits
        for product in self.products_list:
            self.products_tree.insert('', tk.END, values=(
                product.get('nom', ''),
                product.get('categorie', ''),
                product.get('prix', ''),
                product.get('Etat', '')
            ))
            
    def delete_selected_product(self):
        """Supprime le produit sélectionné"""
        selected_item = self.products_tree.selection()
        if selected_item:
            index = self.products_tree.index(selected_item[0])
            del self.products_list[index]
            self.update_products_display()
            messagebox.showinfo("Succès", "Produit supprimé!")
        else:
            messagebox.showwarning("Attention", "Veuillez sélectionner un produit à supprimer.")
            
    def edit_selected_product(self):
        """Charge le produit sélectionné dans le formulaire pour modification"""
        selected_item = self.products_tree.selection()
        if selected_item:
            index = self.products_tree.index(selected_item[0])
            product = self.products_list[index]
            
            # Charger les données dans le formulaire
            self.form_vars['categorie'].set(product.get('categorie', ''))
            self.form_vars['nom'].set(product.get('nom', ''))
            # Enlever ' FCFA' du prix pour l'édition
            prix = product.get('prix', '').replace(' FCFA', '')
            self.form_vars['prix'].set(prix)
            self.form_vars['image'].set(product.get('image', ''))
            self.form_vars['Etat'].set(product.get('Etat', 'Disponible'))
            self.form_vars['boutique'].set(product.get('boutique', ''))  # Charger le champ boutique
            
            # Supprimer de la liste (il sera rajouté après modification)
            del self.products_list[index]
            self.update_products_display()
            
            messagebox.showinfo("Info", "Produit chargé pour modification. Modifiez les champs et cliquez sur 'Ajouter à la liste'.")
        else:
            messagebox.showwarning("Attention", "Veuillez sélectionner un produit à modifier.")
            
    def clear_products_list(self):
        """Vide la liste des produits"""
        if messagebox.askyesno("Confirmation", "Êtes-vous sûr de vouloir vider la liste des produits ?"):
            self.products_list.clear()
            self.update_products_display()
            
    def clear_form(self):
        """Efface le formulaire"""
        for var in self.form_vars.values():
            var.set('')
        self.form_vars['Etat'].set('Disponible')
        self.preview_text.delete(1.0, tk.END)
        
    def copy_json(self):
        """Copie le JSON dans le presse-papier"""
        json_content = self.preview_text.get(1.0, tk.END).strip()
        if json_content:
            self.root.clipboard_clear()
            self.root.clipboard_append(json_content)
            messagebox.showinfo("Succès", "JSON copié dans le presse-papier!")
        else:
            messagebox.showwarning("Attention", "Aucun JSON à copier.")
            
    def test_whatsapp_link(self):
        """Teste le lien WhatsApp"""
        json_content = self.preview_text.get(1.0, tk.END).strip()
        if json_content:
            try:
                data = json.loads(json_content)
                whatsapp_link = data.get('lienWhatsapp', '')
                if whatsapp_link:
                    import webbrowser
                    webbrowser.open(whatsapp_link)
                else:
                    messagebox.showwarning("Attention", "Aucun lien WhatsApp trouvé.")
            except json.JSONDecodeError:
                messagebox.showerror("Erreur", "Format JSON invalide.")
        else:
            messagebox.showwarning("Attention", "Générez d'abord un élément JSON.")
            
    def save_json(self):
        """Sauvegarde la liste des produits en JSON"""
        if not self.products_list:
            messagebox.showwarning("Attention", "Aucun produit à sauvegarder.")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("Fichiers JSON", "*.json"), ("Tous les fichiers", "*.*")],
            title="Sauvegarder la base de données JSON"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(self.products_list, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Succès", f"Base de données sauvegardée:\n{file_path}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde:\n{str(e)}")
                
    def load_json(self):
        """Charge une base de données JSON existante"""
        file_path = filedialog.askopenfilename(
            filetypes=[("Fichiers JSON", "*.json"), ("Tous les fichiers", "*.*")],
            title="Charger une base de données JSON"
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                if isinstance(data, list):
                    self.products_list = data
                    self.update_products_display()
                    messagebox.showinfo("Succès", f"{len(data)} produits chargés!")
                else:
                    messagebox.showerror("Erreur", "Le fichier JSON doit contenir une liste de produits.")
                    
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors du chargement:\n{str(e)}")

def main():
    root = tk.Tk()
    app = JSONDatabaseGenerator(root)
    root.mainloop()

if __name__ == "__main__":
    main()