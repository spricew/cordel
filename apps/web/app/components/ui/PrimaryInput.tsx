type PrimaryInputProps = {
    inputType: string;
    id: string;
    placeholder: string;
    extraclass?: string;
  };
  
  export function PrimaryInput({ inputType, id, placeholder, extraclass = '' }: PrimaryInputProps) {
    return (
      <input
        type={inputType}
        id={id}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-full bg-panel border border-input-border ${extraclass}`}
      />
    );
  }
  