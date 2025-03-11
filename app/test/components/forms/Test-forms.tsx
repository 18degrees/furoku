'use client'

import { Dispatch, SetStateAction } from "react"
import style from './test-forms.module.css'

type knowledgeLevelType = 'well' | 'medium' | 'bad' | null

interface knownWritingFormProps {
    readingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType

    setReadingKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
    setMeaningKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
}
export function KnownWritingForm({readingKnowledge, meaningKnowledge, setReadingKnowledge, setMeaningKnowledge}: knownWritingFormProps) {
    
    function setBothKnowledges(knowledgeLevel: 'well' | 'medium' | 'bad') {
        setReadingKnowledge(knowledgeLevel)
        setMeaningKnowledge(knowledgeLevel)
    }
    return (
        <div className={`${style.container} form-container`}>
            <p className={style.question}>Как вы оцениваете свой уровень&nbsp;знания</p>
            <div className={style['column-headers']}>
                <span>чтений</span> <span>значений</span>
            </div>
            <form className={style.form}>
                <div className={style['inputs-block']}>
                    <div>
                        <input 
                            type="radio"
                            value='well'
                            name="reading"
                            checked={readingKnowledge === 'well'}
                            onChange={event => event.target.checked ? setReadingKnowledge('well') : null}
                        />
                        <span onClick={() => setBothKnowledges('well')}>высоко</span>
                        <input 
                            type="radio"
                            value='well'
                            name="meaning"
                            checked={meaningKnowledge === 'well'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('well') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='medium'
                            name="reading"
                            checked={readingKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setReadingKnowledge('medium') : null}
                        />
                        <span onClick={() => setBothKnowledges('medium')}>средне</span>
                        <input 
                            type="radio"
                            value='medium'
                            name="meaning"
                            checked={meaningKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('medium') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='medium'
                            name="reading"
                            checked={readingKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setReadingKnowledge('bad') : null}
                        />
                        <span onClick={() => setBothKnowledges('bad')}>низко</span>
                        <input 
                            type="radio"
                            value='bad'
                            name="meaning"
                            checked={meaningKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('bad') : null}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}

interface knownReadingFormProps {
    writingKnowledge: knowledgeLevelType
    meaningKnowledge: knowledgeLevelType

    setWritingKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
    setMeaningKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
}

export function KnownReadingForm({writingKnowledge, meaningKnowledge, setWritingKnowledge, setMeaningKnowledge}: knownReadingFormProps) {
    
    function setBothKnowledges(knowledgeLevel: 'well' | 'medium' | 'bad') {
        setWritingKnowledge(knowledgeLevel)
        setMeaningKnowledge(knowledgeLevel)
    }
    return (
        <div className={`${style.container} form-container`}>
            <p className={style.question}>Как вы оцениваете свой уровень&nbsp;знания</p>
            <div className={style['column-headers']}>
                <span>написания</span> <span>значений</span>
            </div>
            <form className={style.form}>
                <div className={style['inputs-block']}>
                    <div>
                        <input 
                            type="radio"
                            value='well'
                            name="writing"
                            checked={writingKnowledge === 'well'}
                            onChange={event => event.target.checked ? setWritingKnowledge('well') : null}
                        />
                        <span onClick={() => setBothKnowledges('well')}>высоко</span>
                        <input 
                            type="radio"
                            value='well'
                            name="meaning"
                            checked={meaningKnowledge === 'well'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('well') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='medium'
                            name="writing"
                            checked={writingKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setWritingKnowledge('medium') : null}
                        />
                        <span onClick={() => setBothKnowledges('medium')}>средне</span>
                        <input 
                            type="radio"
                            value='medium'
                            name="meaning"
                            checked={meaningKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('medium') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='medium'
                            name="writing"
                            checked={writingKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setWritingKnowledge('bad') : null}
                        />
                        <span onClick={() => setBothKnowledges('bad')}>низко</span>
                        <input 
                            type="radio"
                            value='bad'
                            name="meaning"
                            checked={meaningKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setMeaningKnowledge('bad') : null}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}

interface knownMeaningFormProps {
    writingKnowledge: knowledgeLevelType
    readingKnowledge: knowledgeLevelType

    setWritingKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
    setReadingKnowledge: Dispatch<SetStateAction<knowledgeLevelType>>
}
export function KnownMeaningForm({readingKnowledge, writingKnowledge, setReadingKnowledge, setWritingKnowledge}: knownMeaningFormProps) {
    
    function setBothKnowledges(knowledgeLevel: 'well' | 'medium' | 'bad') {
        setReadingKnowledge(knowledgeLevel)
        setWritingKnowledge(knowledgeLevel)
    }
    return (
        <div className={`${style.container} form-container`}>
            <p className={style.question}>Как вы оцениваете свой уровень&nbsp;знания</p>
            <div className={style['column-headers']}>
                <span>написания</span> <span>чтений</span>
            </div>
            <form className={style.form}>
                <div className={style['inputs-block']}>
                    <div>
                        <input 
                            type="radio"
                            value='well'
                            name="writing"
                            checked={writingKnowledge === 'well'}
                            onChange={event => event.target.checked ? setWritingKnowledge('well') : null}
                        />
                        <span onClick={() => setBothKnowledges('well')}>высоко</span>
                        <input 
                            type="radio"
                            value='well'
                            name="reading"
                            checked={readingKnowledge === 'well'}
                            onChange={event => event.target.checked ? setReadingKnowledge('well') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='medium'
                            name="writing"
                            checked={writingKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setWritingKnowledge('medium') : null}
                        />
                        <span onClick={() => setBothKnowledges('medium')}>средне</span>
                        <input 
                            type="radio"
                            value='medium'
                            name="reading"
                            checked={readingKnowledge === 'medium'}
                            onChange={event => event.target.checked ? setReadingKnowledge('medium') : null}
                        />
                    </div>
                    <div>
                        <input 
                            type="radio"
                            value='bad'
                            name="writing"
                            checked={writingKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setWritingKnowledge('bad') : null}
                        />
                        <span onClick={() => setBothKnowledges('bad')}>низко</span>
                        <input 
                            type="radio"
                            value='medium'
                            name="reading"
                            checked={readingKnowledge === 'bad'}
                            onChange={event => event.target.checked ? setReadingKnowledge('bad') : null}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}