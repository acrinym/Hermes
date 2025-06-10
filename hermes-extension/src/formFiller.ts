interface ProfileData {
    [key: string]: string;
}

export function fillForm(profile: ProfileData) {
    const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');
    fields.forEach(field => {
        const key = field.name || field.id;
        if (key && profile[key] !== undefined) {
            (field as HTMLInputElement).value = profile[key];
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}
