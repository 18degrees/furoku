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
        changeTheme: (state, action: PayloadAction<theme>) => {
            state.value = action.payload

            localStorage.setItem('theme', action.payload);
        }
    }
})

export const { setInitialTheme, changeTheme } = themeSlice.actions

export default themeSlice.reducer