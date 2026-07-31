// Types de la base Woto — écrits à la main depuis supabase/01_schema.sql,
// au format de `supabase gen types typescript`.
// À régénérer si le schéma change :
//   npx supabase gen types typescript --project-id kvwlbthtqfryqugwbhwy > lib/database.types.ts
//
// Conventions : uuid/text/date/timestamptz -> string, bigint/int/smallint -> number.
// Les montants sont des entiers en F CFA.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profils: {
        Row: {
          id: string
          nom: string
          email: string
          telephone: string | null
          actif: boolean
          cree_le: string
        }
        Insert: {
          id: string
          nom: string
          email: string
          telephone?: string | null
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          nom?: string
          email?: string
          telephone?: string | null
          actif?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      vehicules: {
        Row: {
          id: string
          immatriculation: string
          marque: string | null
          modele: string | null
          annee: number | null
          date_acquisition: string | null
          prix_acquisition: number | null
          km_actuel: number | null
          actif: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          immatriculation: string
          marque?: string | null
          modele?: string | null
          annee?: number | null
          date_acquisition?: string | null
          prix_acquisition?: number | null
          km_actuel?: number | null
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          immatriculation?: string
          marque?: string | null
          modele?: string | null
          annee?: number | null
          date_acquisition?: string | null
          prix_acquisition?: number | null
          km_actuel?: number | null
          actif?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          id: string
          nom: string
          telephone: string | null
          actif: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          nom: string
          telephone?: string | null
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          nom?: string
          telephone?: string | null
          actif?: boolean
          cree_le?: string
        }
        Relationships: []
      }
      contrats: {
        Row: {
          id: string
          vehicule_id: string
          chauffeur_id: string | null
          date_debut: string
          date_fin: string | null
          montant_journalier: number
          jours_actifs: number[]
          solde_initial: number
          caution: number
          actif: boolean
          cree_le: string
        }
        Insert: {
          id?: string
          vehicule_id: string
          chauffeur_id?: string | null
          date_debut: string
          date_fin?: string | null
          montant_journalier?: number
          jours_actifs?: number[]
          solde_initial?: number
          caution?: number
          actif?: boolean
          cree_le?: string
        }
        Update: {
          id?: string
          vehicule_id?: string
          chauffeur_id?: string | null
          date_debut?: string
          date_fin?: string | null
          montant_journalier?: number
          jours_actifs?: number[]
          solde_initial?: number
          caution?: number
          actif?: boolean
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrats_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrats_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustements: {
        Row: {
          id: string
          contrat_id: string
          date_debut: string
          date_fin: string
          montant_journalier: number
          motif: string
          commentaire: string | null
          cree_par: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          contrat_id: string
          date_debut: string
          date_fin: string
          montant_journalier?: number
          motif: string
          commentaire?: string | null
          cree_par?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          contrat_id?: string
          date_debut?: string
          date_fin?: string
          montant_journalier?: number
          motif?: string
          commentaire?: string | null
          cree_par?: string | null
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustements_contrat_id_fkey"
            columns: ["contrat_id"]
            isOneToOne: false
            referencedRelation: "contrats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustements_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      versements: {
        Row: {
          id: string
          contrat_id: string
          date: string
          montant: number
          mode: string
          note: string | null
          saisi_par: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          contrat_id: string
          date: string
          montant: number
          mode?: string
          note?: string | null
          saisi_par?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          contrat_id?: string
          date?: string
          montant?: number
          mode?: string
          note?: string | null
          saisi_par?: string | null
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "versements_contrat_id_fkey"
            columns: ["contrat_id"]
            isOneToOne: false
            referencedRelation: "contrats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versements_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          id: string
          vehicule_id: string
          date: string
          categorie: string
          montant: number
          fournisseur: string | null
          note: string | null
          km: number | null
          justificatif_url: string | null
          saisi_par: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          vehicule_id: string
          date: string
          categorie: string
          montant: number
          fournisseur?: string | null
          note?: string | null
          km?: number | null
          justificatif_url?: string | null
          saisi_par?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          vehicule_id?: string
          date?: string
          categorie?: string
          montant?: number
          fournisseur?: string | null
          note?: string | null
          km?: number | null
          justificatif_url?: string | null
          saisi_par?: string | null
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_saisi_par_fkey"
            columns: ["saisi_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      echeances: {
        Row: {
          id: string
          vehicule_id: string
          type: string
          libelle: string
          date_echeance: string | null
          km_echeance: number | null
          montant: number | null
          statut: string
          rappel_jours: number
          cree_le: string
        }
        Insert: {
          id?: string
          vehicule_id: string
          type: string
          libelle: string
          date_echeance?: string | null
          km_echeance?: number | null
          montant?: number | null
          statut?: string
          rappel_jours?: number
          cree_le?: string
        }
        Update: {
          id?: string
          vehicule_id?: string
          type?: string
          libelle?: string
          date_echeance?: string | null
          km_echeance?: number | null
          montant?: number | null
          statut?: string
          rappel_jours?: number
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "echeances_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          id: string
          vehicule_id: string
          date: string
          km: number | null
          etat_general: number | null
          commentaire: string | null
          cree_par: string | null
          cree_le: string
        }
        Insert: {
          id?: string
          vehicule_id: string
          date?: string
          km?: number | null
          etat_general?: number | null
          commentaire?: string | null
          cree_par?: string | null
          cree_le?: string
        }
        Update: {
          id?: string
          vehicule_id?: string
          date?: string
          km?: number | null
          etat_general?: number | null
          commentaire?: string | null
          cree_par?: string | null
          cree_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_cree_par_fkey"
            columns: ["cree_par"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          id: string
          inspection_id: string
          chemin: string
          angle: string
          ordre: number
        }
        Insert: {
          id?: string
          inspection_id: string
          chemin: string
          angle: string
          ordre?: number
        }
        Update: {
          id?: string
          inspection_id?: string
          chemin?: string
          angle?: string
          ordre?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      partages: {
        Row: {
          id: string
          vehicule_id: string
          jeton: string
          libelle: string | null
          voir_calendrier: boolean
          voir_depenses: boolean
          voir_photos: boolean
          actif: boolean
          cree_le: string
          dernier_acces: string | null
        }
        Insert: {
          id?: string
          vehicule_id: string
          jeton?: string
          libelle?: string | null
          voir_calendrier?: boolean
          voir_depenses?: boolean
          voir_photos?: boolean
          actif?: boolean
          cree_le?: string
          dernier_acces?: string | null
        }
        Update: {
          id?: string
          vehicule_id?: string
          jeton?: string
          libelle?: string | null
          voir_calendrier?: boolean
          voir_depenses?: boolean
          voir_photos?: boolean
          actif?: boolean
          cree_le?: string
          dernier_acces?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partages_vehicule_id_fkey"
            columns: ["vehicule_id"]
            isOneToOne: false
            referencedRelation: "vehicules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      est_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      attendu_par_jour: {
        Args: {
          p_contrat: string
          p_du?: string
          p_au?: string
        }
        Returns: {
          jour: string
          montant: number
        }[]
      }
      solde_chauffeur: {
        Args: {
          p_contrat: string
          p_au?: string
        }
        Returns: number
      }
      etat_du_mois: {
        Args: {
          p_contrat: string
          p_annee: number
          p_mois: number
        }
        Returns: {
          jour: string
          attendu: number
          recu: number
          etat: string
          motif: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
