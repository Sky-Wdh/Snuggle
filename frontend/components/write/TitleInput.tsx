interface TitleInputProps {
    value: string
    onChange: (value: string) => void
}

const MAX_TITLE_LENGTH = 100

export default function TitleInput({ value, onChange }: TitleInputProps) {
    return (
        <div className="w-full">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={MAX_TITLE_LENGTH}
                className="w-full border-none bg-transparent text-4xl font-bold text-black placeholder-black/30 outline-none dark:text-white dark:placeholder-white/30"
            />
            <div className="mt-2 text-right text-xs text-black/30 dark:text-white/30">
                {value.length}/{MAX_TITLE_LENGTH}
            </div>
        </div>
    )
}
