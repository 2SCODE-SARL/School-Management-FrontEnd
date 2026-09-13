import { useState } from 'react'
import { Dices, Eye, EyeOff } from 'lucide-react'
import { TextField } from '../../components/ui/TextField'
import { Select } from '../../components/ui/Select'
import { generatePassword } from '../../lib/generatePassword'
import { COMPTE_EMPLOYE_ROLE_OPTIONS } from '../../config/rhLabels'

/**
 * Champs communs du compte de connexion d'un employé (email, mot de passe,
 * rôle, téléphone) — réutilisés à la création imbriquée (EmployeForm) et au
 * provisionnement après coup (ProvisionnerCompteForm).
 */
export function CompteEmployeFields({ value, onChange, errors = {} }) {
  const [showPassword, setShowPassword] = useState(false)

  function update(field) {
    return (e) => onChange({ ...value, [field]: e.target.value })
  }

  function handleGeneratePassword() {
    onChange({ ...value, password: generatePassword() })
    setShowPassword(true)
  }

  return (
    <div className="space-y-4">
      <TextField
        id="compte-email"
        label="Adresse e-mail"
        type="email"
        required
        value={value.email}
        onChange={update('email')}
        error={errors.email}
        placeholder="employe@ecole.gn"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          id="compte-roleCode"
          label="Rôle du compte"
          options={COMPTE_EMPLOYE_ROLE_OPTIONS}
          value={value.roleCode}
          onChange={update('roleCode')}
          required
        />
        <TextField
          id="compte-telephone"
          label="Téléphone"
          value={value.telephone}
          onChange={update('telephone')}
          placeholder="+224620000000"
        />
      </div>

      <div>
        <TextField
          id="compte-password"
          label="Mot de passe"
          type={showPassword ? 'text' : 'password'}
          required
          value={value.password}
          onChange={update('password')}
          error={errors.password}
          placeholder="8 caractères minimum"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-ink-400 hover:text-ink-600 transition-colors"
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          }
        />
        <button
          type="button"
          onClick={handleGeneratePassword}
          className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1.5"
        >
          <Dices className="h-3.5 w-3.5" />
          Générer un mot de passe sécurisé
        </button>
      </div>
    </div>
  )
}
