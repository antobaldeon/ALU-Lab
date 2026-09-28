/* Jacobi uses only the previous vector for every component of each new iterate. */
function solveJacobi(A, b, initial, tolerance, maxIterations) {
    const n = A.length;
    if (!n || n > 30 || A.some(row => row.length !== n || row.some(v => !Number.isFinite(v))) || b.length !== n || initial.length !== n || [...b, ...initial].some(v => !Number.isFinite(v)))
        throw Error('Completa la matriz y los vectores con números finitos.');
    if (!Number.isFinite(tolerance) || tolerance <= 0 || tolerance >= 1)
        throw Error('La tolerancia debe ser mayor que 0 y menor que 1.');
    if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > 1000)
        throw Error('Usa un máximo entero entre 1 y 1000 iteraciones.');
    if (A.some((row, i) => row[i] === 0))
        throw Error('Jacobi requiere una diagonal sin ceros. Reordena las ecuaciones antes de resolver.');
    const dominance = A.map((row, i) => {
        const diagonal = Math.abs(row[i]);
        const off = row.reduce((sum, value, j) => sum + (j === i ? 0 : Math.abs(value)), 0);
        return { diagonal, off, strict: diagonal > off };
    });
    const q = Math.max(...dominance.map(row => row.off / row.diagonal));
    const norm = vector => Math.max(...vector.map(Math.abs));
    const residual = x => norm(A.map((row, i) => row.reduce((sum, v, j) => sum + v * x[j], 0) - b[i]));
    let x = initial.slice();
    const history = [{ k: 0, x: x.slice(), error: null, residual: residual(x) }];
    let status = 'limit';
    for (let k = 1; k <= maxIterations; k++) {
        const next = A.map((row, i) => (b[i] - row.reduce((sum, value, j) => sum + (j === i ? 0 : value * x[j]), 0)) / row[i]);
        const delta = norm(next.map((value, i) => value - x[i]));
        const size = norm(next);
        const error = size === 0 ? (delta === 0 ? 0 : Infinity) : delta / size;
        const r = residual(next);
        if (next.some(v => !Number.isFinite(v)) || !Number.isFinite(delta) || !Number.isFinite(r)) {
            status = 'overflow';
            break;
        }
        x = next;
        history.push({ k, x: x.slice(), error, residual: r });
        if (error <= tolerance) { status = 'converged'; break; }
    }
    return { x, history, dominance, q, status };
}

// Keep the numerical function available to Node for independent verification.
if (typeof module !== 'undefined') module.exports = { solveJacobi };

if (typeof document !== 'undefined') (() => {
    const el = id => document.getElementById(id);
    const out = el('jacobiOut');
    const editor = el('jacobiEditor');
    const number = v => v === null ? '—' : !Number.isFinite(v) ? '∞' : v !== 0 && (Math.abs(v) < 0.000001 || Math.abs(v) >= 1e9) ? v.toExponential(6) : Number(v.toFixed(8)).toString();
    const reset = () => { out.innerHTML = '<div class="empty-state"><h3>Datos listos</h3><p>Pulsa «Resolver con Jacobi» para calcular el análisis y el historial.</p></div>'; };
    function generate(example = false) {
        const n = Number(el('jacobiN').value);
        if (!Number.isInteger(n) || n < 1 || n > 30) {
            editor.dataset.size = '';
            out.innerHTML = '<div class="error">Usa un número entero de variables entre 1 y 30.</div>';
            return;
        }
        const A = [[10, -2, -1, 0], [-1, 8, 0, -2], [-2, 0, 12, -3], [0, -1, -2, 9]];
        const b = [15, 18, 25, 20];
        editor.dataset.size = String(n);
        editor.innerHTML = '<p>Coeficientes A · término independiente b · vector inicial x⁽⁰⁾</p><div class="matrix">' + Array.from({ length: n }, (_, i) => '<div class="matrix-row">' + Array.from({ length: n }, (_, j) => `<input type="number" step="any" data-ja="${i},${j}" aria-label="Jacobi A fila ${i + 1}, columna ${j + 1}" value="${example ? A[i][j] : i === j ? 1 : 0}">`).join('') + `<span>=</span><input type="number" step="any" data-jb="${i}" aria-label="Jacobi b fila ${i + 1}" value="${example ? b[i] : 0}"><span>x⁽⁰⁾</span><input type="number" step="any" data-jx="${i}" aria-label="Jacobi valor inicial ${i + 1}" value="0"></div>`).join('') + '</div>';
        reset();
    }
    el('jacobiGenerate').onclick = () => generate();
    el('jacobiExample').onclick = () => {
        el('jacobiN').value = 4;
        el('jacobiTolerance').value = '0.0001';
        el('jacobiMax').value = 100;
        generate(true);
    };
    el('jacobiInputs').addEventListener('input', reset);
    el('jacobiSolve').onclick = () => {
        try {
            const n = Number(el('jacobiN').value);
            if (!Number.isInteger(n) || n < 1 || n > 30 || Number(editor.dataset.size) !== n)
                throw Error('Verifica el tamaño (1–30) y pulsa «Generar sistema» para actualizar la matriz.');
            if ([...el('jacobiInputs').querySelectorAll('input')].some(input => input.value.trim() === '' || !Number.isFinite(Number(input.value))))
                throw Error('Completa todos los campos con números válidos.');
            const A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n), initial = Array(n);
            editor.querySelectorAll('[data-ja]').forEach(input => { const [i, j] = input.dataset.ja.split(',').map(Number); A[i][j] = Number(input.value); });
            editor.querySelectorAll('[data-jb]').forEach(input => { b[Number(input.dataset.jb)] = Number(input.value); });
            editor.querySelectorAll('[data-jx]').forEach(input => { initial[Number(input.dataset.jx)] = Number(input.value); });
            const result = solveJacobi(A, b, initial, Number(el('jacobiTolerance').value), Number(el('jacobiMax').value));
            const strict = result.dominance.every(row => row.strict);
            const last = result.history[result.history.length - 1];
            const message = result.status === 'converged' ? 'Tolerancia alcanzada' : result.status === 'overflow' ? 'Cálculo detenido por desbordamiento numérico; se muestra la última aproximación finita' : 'Máximo de iteraciones alcanzado sin cumplir la tolerancia';
            out.innerHTML = `<section class="panel"><h3>Análisis de dominancia diagonal</h3><div class="jacobi-table"><table class="mtable"><thead><tr><th>Fila</th><th>|aᵢᵢ|</th><th>∑ⱼ≠ᵢ |aᵢⱼ|</th><th>¿Mayor estrictamente?</th></tr></thead><tbody>${result.dominance.map((row, i) => `<tr><td>${i + 1}</td><td>${number(row.diagonal)}</td><td>${number(row.off)}</td><td>${row.strict ? 'Sí' : 'No'}</td></tr>`).join('')}</tbody></table></div><p>${strict ? 'Todas las filas cumplen la desigualdad: A es EDD. Para la matriz de iteración B = −D⁻¹(A − D), ρ(B) ≤ ‖B‖∞ = q &lt; 1. Por ello Jacobi converge para cualquier vector inicial.' : 'A no es EDD por filas. Esto no demuestra divergencia; la condición general es ρ(B) &lt; 1. Aquí no se calcula el radio espectral, así que la convergencia no está garantizada por este análisis.'} q = ${number(result.q)}.</p></section><section class="panel jacobi-card"><h3>${message}</h3><p>${last.k} iteraciones · Error relativo: ${number(last.error)} · Residuo ‖Ax − b‖∞: ${number(last.residual)}</p><div class="result">${result.x.map((value, i) => `x<sub>${i + 1}</sub> = ${number(value)}`).join('<br>')}</div></section><section class="panel jacobi-card"><h3>Historial de iteraciones</h3><p>Se muestra k = 0 como punto de partida; el error se calcula desde k = 1. Los cálculos conservan la precisión interna, aunque la tabla redondea los valores.</p><div class="jacobi-table" tabindex="0" role="region" aria-label="Historial de Jacobi, tabla desplazable"><table class="mtable"><thead><tr><th>k</th>${result.x.map((_, i) => `<th>x${i + 1}</th>`).join('')}<th>Error relativo</th><th>Residuo ∞</th></tr></thead><tbody>${result.history.map(row => `<tr><td>${row.k}</td>${row.x.map(value => `<td>${number(value)}</td>`).join('')}<td>${number(row.error)}</td><td>${number(row.residual)}</td></tr>`).join('')}</tbody></table></div></section>`;
        } catch (error) {
            out.replaceChildren();
            const message = document.createElement('div');
            message.className = 'error';
            message.textContent = error.message;
            out.append(message);
        }
    };
    generate(true);
})();
