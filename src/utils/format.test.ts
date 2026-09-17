import { excerpt, formatDate } from './format'

describe('formatDate', () => {
  it('converte a data ISO da API para o formato brasileiro', () => {
    expect(formatDate('2026-07-14T21:33:04.854Z')).toBe('14 de julho de 2026')
  })

  it('devolve string vazia para data invalida em vez de "Invalid Date"', () => {
    // Uma data ruim nao pode quebrar a renderizacao do post inteiro.
    expect(formatDate('nao e uma data')).toBe('')
    expect(formatDate('')).toBe('')
  })
})

describe('excerpt', () => {
  it('devolve o conteudo inteiro quando ele ja e curto', () => {
    expect(excerpt('Aula sobre 1789.')).toBe('Aula sobre 1789.')
  })

  it('normaliza quebras de linha e espacos multiplos', () => {
    expect(excerpt('Primeira linha.\n\n  Segunda    linha.')).toBe(
      'Primeira linha. Segunda linha.',
    )
  })

  it('corta no limite e acrescenta reticencias', () => {
    const resultado = excerpt('a'.repeat(200), 50)

    expect(resultado).toHaveLength(51) // 50 caracteres + o caractere de reticencias
    expect(resultado.endsWith('…')).toBe(true)
  })

  it('corta na ultima palavra inteira, nao no meio dela', () => {
    const texto = 'Revolucao Francesa causas consequencias impactos'

    const resultado = excerpt(texto, 25)

    expect(resultado).toBe('Revolucao Francesa causas…')
    expect(resultado).not.toContain('conseq…')
  })

  it('ignora espacos nas pontas', () => {
    expect(excerpt('   texto   ')).toBe('texto')
  })
})
