import { Input, type InputProps } from '../ui/Input'
export function NumberInput(props: InputProps) { return <Input type="number" min="0" step="any" {...props} /> }
