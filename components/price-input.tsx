"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"

interface PriceInputProps {
  value: string
  onChange: (value: string) => void
  currency: string
  onCurrencyChange: (currency: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  label?: string
  required?: boolean
}

export function PriceInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  error,
  disabled = false,
  placeholder = "0.00",
  label = "Price",
  required = false
}: PriceInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const [validationError, setValidationError] = useState<string>("")

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const validatePrice = (priceValue: string): string => {
    if (!priceValue.trim()) {
      return required ? "Price is required" : ""
    }

    const numericValue = parseFloat(priceValue)
    
    if (isNaN(numericValue)) {
      return "Please enter a valid number"
    }

    if (numericValue <= 0) {
      return "Price must be greater than 0"
    }

    if (numericValue > 999999) {
      return "Price is too high"
    }

    // Check for too many decimal places
    const decimalPlaces = (priceValue.split('.')[1] || '').length
    if (decimalPlaces > 8) {
      return "Maximum 8 decimal places allowed"
    }

    return ""
  }

  const handleValueChange = (newValue: string) => {
    // Allow only numbers and decimal point
    const sanitizedValue = newValue.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = sanitizedValue.split('.')
    if (parts.length > 2) {
      return
    }

    setLocalValue(sanitizedValue)
    
    const error = validatePrice(sanitizedValue)
    setValidationError(error)
    
    onChange(sanitizedValue)
  }

  const handleBlur = () => {
    // Format the value on blur if it's a valid number
    if (localValue && !isNaN(parseFloat(localValue))) {
      const formatted = parseFloat(localValue).toString()
      setLocalValue(formatted)
      onChange(formatted)
    }
  }

  const displayError = error || validationError

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="price-input" className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="price-input"
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={displayError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
        </div>
        
        <Select value={currency} onValueChange={onCurrencyChange} disabled={disabled}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FLOW">FLOW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {displayError && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          {displayError}
        </div>
      )}

      {!displayError && localValue && !isNaN(parseFloat(localValue)) && (
        <div className="text-xs text-muted-foreground">
          ≈ ${(parseFloat(localValue) * 0.50).toFixed(2)} USD
        </div>
      )}
    </div>
  )
}