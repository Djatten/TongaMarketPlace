import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import json
import os
from pathlib import Path

class ProductManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Gestionnaire de Produits JSON")
        self.root.geometry("1000x700")
        
        # Chemin vers le fichier JSON
        self.json_file = "data/produits.json"
        
        # Créer le répertoire data s'il n'existe pas
        os.makedirs("data", exist_ok=True)
        
        # Charger les données existantes
        self.products = self.load_products()
        self.categories = set()
        self.boutiques = set()
        self.extract_categories_and_boutiques()
        
        # Style ttk pour un look plus moderne
        self.setup_style()
        
        self.setup_ui()
        
    def setup_style(self):
        style = ttk.Style(self.root)
        try:
            style.theme_use('clam')
        except Exception:
            pass
        style.configure('TFrame', padding=6)
        style.configure('TLabel', font=('Segoe UI', 10))
        style.configure('Header.TLabel', font=('Segoe UI', 16, 'bold'))
        style.configure('TButton', padding=6)
        style.configure('TEntry', padding=4)
        style.configure('TLabelframe', font=('Segoe UI', 10, 'bold'))

    def normalize_path(self, p: str) -> str:
        """Normaliser les chemins pour utiliser '/' au lieu de '\'."""
        if not p:
            return p
        return str(p).replace('\\', '/')

    def load_products(self):
        """Charger les produits depuis le fichier JSON et normaliser les chemins d'images."""
        if os.path.exists(self.json_file):
            try:
                with open(self.json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Normaliser les chemins d'images si présents
                    for prod in data:
                        if 'images' in prod and isinstance(prod['images'], list):
                            prod['images'] = [self.normalize_path(img) for img in prod['images']]
                    return data
            except (json.JSONDecodeError, FileNotFoundError):
                return []
        return []
    
    def save_products(self):
        """Sauvegarder les produits dans le fichier JSON en veillant à normaliser les chemins."""
        try:
            # Normaliser les chemins d'images avant sauvegarde
            for prod in self.products:
                if 'images' in prod and isinstance(prod['images'], list):
                    prod['images'] = [self.normalize_path(img) for img in prod['images']]
            with open(self.json_file, 'w', encoding='utf-8') as f:
                json.dump(self.products, f, ensure_ascii=False, indent=2)
            messagebox.showinfo("Succès", "Produits sauvegardés avec succès!")
        except Exception as e:
            messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde: {str(e)}")
    
    def extract_categories_and_boutiques(self):
        """Extraire toutes les catégories et boutiques existantes depuis self.products."""
        self.categories.clear()
        self.boutiques.clear()
        for product in self.products:
            if 'category' in product and product['category']:
                self.categories.add(product['category'])
            # On suppose que le champ boutique s'appelle 'boutique' dans le JSON
            if 'boutique' in product and product['boutique']:
                self.boutiques.add(product['boutique'])
    
    def get_next_id(self):
        """Obtenir le prochain ID disponible"""
        if not self.products:
            return 1
        existing_ids = [product.get('id', 0) for product in self.products]
        return max(existing_ids) + 1
    
    def check_slug_exists(self, slug, exclude_id=None):
        """Vérifier si un slug existe déjà"""
        for product in self.products:
            if product.get('slug') == slug and product.get('id') != exclude_id:
                return True
        return False
    
    def setup_ui(self):
        """Configurer l'interface utilisateur"""
        # Titre
        title_frame = ttk.Frame(self.root)
        title_frame.pack(fill='x', padx=10, pady=5)
        ttk.Label(title_frame, text="Gestionnaire de Produits", style='Header.TLabel').pack()
        
        # Frame principal avec scrollbar
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Canvas et scrollbar pour le défilement
        canvas = tk.Canvas(main_frame)
        scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Variables pour les champs
        self.setup_variables()
        
        # Champs de saisie
        self.create_input_fields(scrollable_frame)
        
        # Boutons
        self.create_buttons(scrollable_frame)
        
        # Liste des produits
        self.create_product_list(scrollable_frame)
        
        # Binding pour la molette de la souris
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # rendre la fenêtre responsive
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)
    
    def setup_variables(self):
        """Initialiser les variables Tkinter"""
        self.var_title = tk.StringVar()
        self.var_short = tk.StringVar()
        self.var_category = tk.StringVar()
        self.var_boutique = tk.StringVar()         # nouveau: boutique
        self.var_price = tk.StringVar()
        self.var_priceBoutique = tk.StringVar()    # nouveau: prix en boutique
        self.var_oldprice = tk.StringVar()  # nouveau champ oldPrice
        self.var_stock = tk.StringVar()
        self.var_rating = tk.StringVar()
        self.var_slug = tk.StringVar()
        self.images_list = []
        self.features_list = []
        self.current_product_id = None
    
    def create_input_fields(self, parent):
        """Créer les champs de saisie"""
        fields_frame = ttk.LabelFrame(parent, text="Informations du produit", padding=10)
        fields_frame.pack(fill='x', pady=5)
        
        # Ligne 1: Titre et Slug
        row1 = ttk.Frame(fields_frame)
        row1.pack(fill='x', pady=2)
        
        ttk.Label(row1, text="Titre:").pack(side='left')
        ttk.Entry(row1, textvariable=self.var_title, width=30).pack(side='left', padx=(5,20))
        
        ttk.Label(row1, text="Slug:").pack(side='left')
        slug_entry = ttk.Entry(row1, textvariable=self.var_slug, width=30)
        slug_entry.pack(side='left', padx=5)
        
        # Auto-génération du slug
        def generate_slug(*args):
            if not self.var_slug.get():
                title = self.var_title.get().lower()
                slug = title.replace(' ', '-').replace('é', 'e').replace('è', 'e').replace('à', 'a')
                slug = ''.join(c for c in slug if c.isalnum() or c == '-')
                self.var_slug.set(slug)
        
        self.var_title.trace('w', generate_slug)
        
        # Ligne 2: Description courte
        row2 = ttk.Frame(fields_frame)
        row2.pack(fill='x', pady=2)
        
        ttk.Label(row2, text="Description courte:").pack(side='left')
        ttk.Entry(row2, textvariable=self.var_short, width=70).pack(side='left', padx=5, fill='x', expand=True)
        
        # Ligne 3: Catégorie et Boutique avec combobox
        row3 = ttk.Frame(fields_frame)
        row3.pack(fill='x', pady=2)
        
        ttk.Label(row3, text="Catégorie:").pack(side='left')
        category_combo = ttk.Combobox(row3, textvariable=self.var_category, width=25)
        category_combo.pack(side='left', padx=5)
        category_combo['values'] = list(self.categories)
        
        ttk.Button(row3, text="Actualiser catégories", command=self.refresh_categories).pack(side='left', padx=10)

        ttk.Label(row3, text="Boutique:").pack(side='left', padx=(20,0))
        boutique_combo = ttk.Combobox(row3, textvariable=self.var_boutique, width=25)
        boutique_combo.pack(side='left', padx=5)
        boutique_combo['values'] = list(self.boutiques)
        ttk.Button(row3, text="Actualiser boutiques", command=self.refresh_boutiques).pack(side='left', padx=10)
        
        # Ligne 4: Prix, PrixBoutique, Ancien prix, Stock, Rating
        row4 = ttk.Frame(fields_frame)
        row4.pack(fill='x', pady=2)
        
        ttk.Label(row4, text="Prix:").pack(side='left')
        ttk.Entry(row4, textvariable=self.var_price, width=12).pack(side='left', padx=(5,10))
        
        ttk.Label(row4, text="Prix boutique:").pack(side='left')
        ttk.Entry(row4, textvariable=self.var_priceBoutique, width=12).pack(side='left', padx=(5,10))
        
        ttk.Label(row4, text="Ancien prix:").pack(side='left')
        ttk.Entry(row4, textvariable=self.var_oldprice, width=12).pack(side='left', padx=(5,10))
        
        ttk.Label(row4, text="Stock:").pack(side='left')
        ttk.Entry(row4, textvariable=self.var_stock, width=8).pack(side='left', padx=(5,10))
        
        ttk.Label(row4, text="Note:").pack(side='left')
        ttk.Entry(row4, textvariable=self.var_rating, width=8).pack(side='left', padx=5)
        
        # Images
        images_frame = ttk.LabelFrame(fields_frame, text="Images (sélection multiple possible)")
        images_frame.pack(fill='x', pady=5)
        
        ttk.Button(images_frame, text="Ajouter des images", 
                  command=self.add_images).pack(side='left', padx=5)
        ttk.Button(images_frame, text="Effacer toutes les images", 
                  command=self.clear_images).pack(side='left', padx=5)
        
        self.images_listbox = tk.Listbox(images_frame, height=4, selectmode=tk.EXTENDED)
        self.images_listbox.pack(fill='x', pady=5, padx=5)
        # suppression via double-clic
        self.images_listbox.bind('<Double-Button-1>', self.remove_image)
        
        ttk.Label(images_frame, text="(Double-clic sur une ligne pour supprimer)").pack(anchor='w')
        
        # Caractéristiques (zone multilignes -> importer une par ligne)
        features_frame = ttk.LabelFrame(fields_frame, text="Caractéristiques (une par ligne)", padding=5)
        features_frame.pack(fill='x', pady=5)

        ttk.Label(features_frame, text="Colle/Écris un paragraphe et mets chaque caractéristique sur une nouvelle ligne:").pack(anchor='w', padx=5)
        self.features_text = scrolledtext.ScrolledText(features_frame, height=4, wrap=tk.WORD)
        self.features_text.pack(fill='x', padx=5, pady=5)

        feature_buttons = ttk.Frame(features_frame)
        feature_buttons.pack(fill='x', padx=5)
        ttk.Button(feature_buttons, text="Importer caractéristiques (par ligne)", command=self.add_feature).pack(side='left', padx=5)
        ttk.Button(feature_buttons, text="Effacer tout", command=self.clear_features).pack(side='left', padx=5)

        self.features_listbox = tk.Listbox(features_frame, height=4)
        self.features_listbox.pack(fill='x', pady=5, padx=5)
        self.features_listbox.bind('<Double-Button-1>', self.remove_feature)
        
        # Description longue
        desc_frame = ttk.LabelFrame(fields_frame, text="Description détaillée")
        desc_frame.pack(fill='both', expand=True, pady=5)
        
        self.desc_text = scrolledtext.ScrolledText(desc_frame, height=8, wrap=tk.WORD)
        self.desc_text.pack(fill='both', expand=True, padx=5, pady=5)
    
    def create_buttons(self, parent):
        """Créer les boutons d'action"""
        buttons_frame = ttk.Frame(parent)
        buttons_frame.pack(fill='x', pady=10)
        
        ttk.Button(buttons_frame, text="Nouveau produit", 
                  command=self.new_product).pack(side='left', padx=5)
        ttk.Button(buttons_frame, text="Ajouter/Modifier", 
                  command=self.save_product).pack(side='left', padx=5)
        ttk.Button(buttons_frame, text="Supprimer", 
                  command=self.delete_product).pack(side='left', padx=5)
        ttk.Button(buttons_frame, text="Sauvegarder JSON", 
                  command=self.save_products).pack(side='left', padx=5)
    
    def create_product_list(self, parent):
        """Créer la liste des produits"""
        list_frame = ttk.LabelFrame(parent, text="Produits existants")
        list_frame.pack(fill='both', expand=True, pady=5)
        
        # Treeview pour afficher les produits (ajout Boutique et Prix boutique)
        columns = ('ID', 'Titre', 'Catégorie', 'Boutique', 'Prix', 'Prix Boutique', 'Ancien prix', 'Stock')
        self.tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=8)
        
        for col in columns:
            self.tree.heading(col, text=col)
            # largeurs adaptatives
            if col == 'Titre':
                self.tree.column(col, width=260)
            elif col == 'Boutique':
                self.tree.column(col, width=180)
            else:
                self.tree.column(col, width=120)
        
        # Scrollbars pour la treeview
        tree_scrolly = ttk.Scrollbar(list_frame, orient='vertical', command=self.tree.yview)
        tree_scrollx = ttk.Scrollbar(list_frame, orient='horizontal', command=self.tree.xview)
        self.tree.configure(yscrollcommand=tree_scrolly.set, xscrollcommand=tree_scrollx.set)
        
        self.tree.pack(side='left', fill='both', expand=True)
        tree_scrolly.pack(side='right', fill='y')
        tree_scrollx.pack(side='bottom', fill='x')
        
        self.tree.bind('<Double-1>', self.load_product)
        
        self.refresh_product_list()
    
    def refresh_categories(self):
        """Actualiser la liste des catégories"""
        self.extract_categories_and_boutiques()
        # Trouver et mettre à jour la combobox des catégories
        for child in self.root.winfo_children():
            self.update_category_combo(child)
    
    def update_category_combo(self, widget):
        """Mettre à jour récursivement les combobox de catégories"""
        try:
            if isinstance(widget, ttk.Combobox) and widget['textvariable'] == str(self.var_category):
                widget['values'] = list(self.categories)
        except Exception:
            pass
        for child in widget.winfo_children():
            self.update_category_combo(child)

    def refresh_boutiques(self):
        """Actualiser la liste des boutiques"""
        self.extract_categories_and_boutiques()
        for child in self.root.winfo_children():
            self.update_boutique_combo(child)

    def update_boutique_combo(self, widget):
        """Mettre à jour récursivement les combobox de boutiques"""
        try:
            if isinstance(widget, ttk.Combobox) and widget['textvariable'] == str(self.var_boutique):
                widget['values'] = list(self.boutiques)
        except Exception:
            pass
        for child in widget.winfo_children():
            self.update_boutique_combo(child)
    
    def add_images(self):
        """Ajouter plusieurs images en une sélection"""
        file_paths = filedialog.askopenfilenames(
            title="Sélectionner des images",
            filetypes=[("Images", "*.jpg *.jpeg *.png *.gif *.bmp")]
        )
        if file_paths:
            for file_path in file_paths:
                # utiliser os.path.relpath puis normaliser les séparateurs
                rel_path = os.path.relpath(file_path)
                rel_path = self.normalize_path(rel_path)
                # Eviter les doublons
                if rel_path not in self.images_list:
                    self.images_list.append(rel_path)
                    self.images_listbox.insert(tk.END, rel_path)
    
    def remove_image(self, event):
        """Supprimer une image (double-clic) ou plusieurs si selection multiple"""
        selection = list(self.images_listbox.curselection())
        if selection:
            # supprimer en partant de la fin pour ne pas casser les indices
            for index in sorted(selection, reverse=True):
                self.images_listbox.delete(index)
                del self.images_list[index]
    
    def clear_images(self):
        """Effacer toutes les images"""
        self.images_listbox.delete(0, tk.END)
        self.images_list.clear()
    
    def add_feature(self):
        """Importer plusieurs caractéristiques depuis la zone de texte (une par ligne)."""
        text = self.features_text.get(1.0, tk.END).strip()
        if not text:
            messagebox.showwarning("Attention", "Aucune caractéristique à importer.")
            return
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        added = 0
        for line in lines:
            if line not in self.features_list:
                self.features_list.append(line)
                self.features_listbox.insert(tk.END, line)
                added += 1
        self.features_text.delete(1.0, tk.END)
        if added:
            messagebox.showinfo("Succès", f"{added} caractéristique(s) importée(s).")
        else:
            messagebox.showinfo("Info", "Aucune nouvelle caractéristique n'a été ajoutée (doublons ignorés).")
    
    def remove_feature(self, event):
        """Supprimer une ou plusieurs caractéristiques (double-clic / multi-sélection)"""
        selection = list(self.features_listbox.curselection())
        if selection:
            for index in sorted(selection, reverse=True):
                self.features_listbox.delete(index)
                del self.features_list[index]
    
    def clear_features(self):
        """Effacer toutes les caractéristiques et vider la zone de texte d'import."""
        self.features_listbox.delete(0, tk.END)
        self.features_list.clear()
        if hasattr(self, 'features_text'):
            self.features_text.delete(1.0, tk.END)
    
    def new_product(self):
        """Nouveau produit"""
        self.clear_form()
        self.current_product_id = None
    
    def clear_form(self):
        """Effacer le formulaire"""
        self.var_title.set("")
        self.var_short.set("")
        self.var_category.set("")
        self.var_boutique.set("")
        self.var_price.set("")
        self.var_priceBoutique.set("")
        self.var_oldprice.set("")
        self.var_stock.set("")
        self.var_rating.set("")
        self.var_slug.set("")
        self.desc_text.delete(1.0, tk.END)
        self.clear_images()
        self.clear_features()
    
    def validate_form(self):
        """Valider le formulaire"""
        if not self.var_title.get().strip():
            messagebox.showerror("Erreur", "Le titre est requis!")
            return False
        
        if not self.var_slug.get().strip():
            messagebox.showerror("Erreur", "Le slug est requis!")
            return False
        
        # Vérifier l'unicité du slug
        if self.check_slug_exists(self.var_slug.get(), self.current_product_id):
            messagebox.showerror("Erreur", "Ce slug existe déjà!")
            return False
        
        try:
            float(self.var_price.get())
        except ValueError:
            messagebox.showerror("Erreur", "Le prix doit être numérique!")
            return False
        
        # priceBoutique est facultatif, mais si renseigné il doit être numérique
        if self.var_priceBoutique.get().strip():
            try:
                float(self.var_priceBoutique.get())
            except ValueError:
                messagebox.showerror("Erreur", "Le prix boutique doit être numérique!")
                return False
        
        # oldPrice est facultatif, mais si renseigné il doit être numérique
        if self.var_oldprice.get().strip():
            try:
                float(self.var_oldprice.get())
            except ValueError:
                messagebox.showerror("Erreur", "L'ancien prix doit être numérique!")
                return False
        
        try:
            int(self.var_stock.get())
        except ValueError:
            messagebox.showerror("Erreur", "Le stock doit être un entier!")
            return False
        
        try:
            float(self.var_rating.get())
        except ValueError:
            messagebox.showerror("Erreur", "La note doit être numérique!")
            return False
        
        return True
    
    def save_product(self):
        """Sauvegarder un produit"""
        if not self.validate_form():
            return
        
        # Normaliser les chemins d'images avant création de l'objet produit
        normalized_images = [self.normalize_path(img) for img in self.images_list]

        product = {
            "id": self.current_product_id or self.get_next_id(),
            "slug": self.var_slug.get().strip(),
            "title": self.var_title.get().strip(),
            "short": self.var_short.get().strip(),
            "category": self.var_category.get().strip(),
            "boutique": self.var_boutique.get().strip(),                    # nouveau
            "price": float(self.var_price.get()),
            "priceBoutique": float(self.var_priceBoutique.get()) if self.var_priceBoutique.get().strip() else None,  # nouveau
            "oldPrice": float(self.var_oldprice.get()) if self.var_oldprice.get().strip() else None,
            "stock": int(self.var_stock.get()),
            "rating": float(self.var_rating.get()),
            "images": normalized_images,
            "features": self.features_list.copy(),
            "description": self.desc_text.get(1.0, tk.END).strip()
        }
        
        # Ajouter la catégorie et la boutique aux sets connus
        if product["category"]:
            self.categories.add(product["category"])
        if product["boutique"]:
            self.boutiques.add(product["boutique"])
        
        # Ajouter ou modifier le produit
        if self.current_product_id:
            # Modifier
            for i, p in enumerate(self.products):
                if p.get('id') == self.current_product_id:
                    self.products[i] = product
                    break
            messagebox.showinfo("Succès", "Produit modifié avec succès!")
        else:
            # Ajouter
            self.products.append(product)
            messagebox.showinfo("Succès", "Produit ajouté avec succès!")
        
        self.refresh_product_list()
        self.clear_form()
        self.current_product_id = None
    
    def load_product(self, event):
        """Charger un produit depuis la liste"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item = self.tree.item(selection[0])
        product_id = item['values'][0]
        
        # Trouver le produit
        product = None
        for p in self.products:
            if p.get('id') == product_id:
                product = p
                break
        
        if not product:
            return
        
        # Charger les données dans le formulaire
        self.current_product_id = product.get('id')
        self.var_title.set(product.get('title', ''))
        self.var_short.set(product.get('short', ''))
        self.var_category.set(product.get('category', ''))
        self.var_boutique.set(product.get('boutique', ''))  # nouveau
        self.var_price.set(str(product.get('price', '')))
        self.var_priceBoutique.set(str(product.get('priceBoutique', '') or ''))  # nouveau
        self.var_oldprice.set(str(product.get('oldPrice', '') or ''))
        self.var_stock.set(str(product.get('stock', '')))
        self.var_rating.set(str(product.get('rating', '')))
        self.var_slug.set(product.get('slug', ''))
        self.desc_text.delete(1.0, tk.END)
        self.desc_text.insert(1.0, product.get('description', ''))
        
        # Charger les images (normaliser les séparateurs)
        self.clear_images()
        for image in product.get('images', []):
            image_norm = self.normalize_path(image)
            self.images_list.append(image_norm)
            self.images_listbox.insert(tk.END, image_norm)
        
        # Charger les caractéristiques
        self.clear_features()
        for feature in product.get('features', []):
            self.features_list.append(feature)
            self.features_listbox.insert(tk.END, feature)
    
    def delete_product(self):
        """Supprimer un produit"""
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Attention", "Sélectionnez un produit à supprimer!")
            return
        
        if messagebox.askyesno("Confirmation", "Êtes-vous sûr de vouloir supprimer ce produit?"):
            item = self.tree.item(selection[0])
            product_id = item['values'][0]
            
            # Supprimer le produit
            self.products = [p for p in self.products if p.get('id') != product_id]
            
            self.refresh_product_list()
            self.clear_form()
            self.current_product_id = None
            messagebox.showinfo("Succès", "Produit supprimé avec succès!")
    
    def refresh_product_list(self):
        """Actualiser la liste des produits"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        for product in self.products:
            self.tree.insert('', 'end', values=(
                product.get('id', ''),
                product.get('title', ''),
                product.get('category', ''),
                product.get('boutique', ''),                         # nouveau
                f"{product.get('price', 0):.2f}",
                f"{product.get('priceBoutique', '') if product.get('priceBoutique', None) is not None else ''}",
                f"{product.get('oldPrice', '') if product.get('oldPrice', None) is not None else ''}",
                product.get('stock', 0)
            ))

if __name__ == "__main__":
    root = tk.Tk()
    app = ProductManager(root)
    root.mainloop()
