import { theme } from '@/app/interfaces/theme.interface'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface IInitialState {
    value: theme
}
const initialState: IInitialState = {
    value: 'light'
}

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setInitialTheme: (state, action: PayloadAction<theme>) => {
            state.value = action.payload
        },
        toggleTheme: (state) => {
            const newTheme = state.value === 'dark' ? 'light' : 'dark'

            state.value = newTheme

            localStorage.setItem('theme', newTheme)

            document.documentElement.classList.toggle('dark')
        }
    }
})

export const { setInitialTheme, toggleTheme } = themeSlice.actions

export default themeSlice.reducer