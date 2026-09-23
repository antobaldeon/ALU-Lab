const $ = s => document.querySelector(s)
  , fmt = v => Math.abs(v) < 1e-12 ? '0' : Number(v.toFixed(6)).toString();
function lu(A) {
    const n = A.length
      , L = Array.from({
        length: n
    }, () => Array(n).fill(0))
      , U = Array.from({
        length: n
    }, () => Array(n).fill(0))
      , steps = [];
    for (let i = 0; i < n; i++) {
        L[i][i] = 1;
        for (let k = i; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++)
                sum += L[i][j] * U[j][k];
            U[i][k] = A[i][k] - sum;
            steps.push(`U${i + 1}${k + 1} = ${fmt(U[i][k])}`)
        }
        if (Math.abs(U[i][i]) < 1e-12)
            throw Error(`Pivote cero en U(${i + 1},${i + 1}). Doolittle sin pivoteo no puede continuar.`);
        for (let k = i + 1; k < n; k++) {
            let sum = 0;
            for (let j = 0; j < i; j++)
                sum += L[k][j] * U[j][i];
            L[k][i] = (A[k][i] - sum) / U[i][i];
            steps.push(`L${k + 1}${i + 1} = ${fmt(L[k][i])}`)
        }
    }
    return {
        L,
        U,
        steps
    }
}
function forward(L, b) {
    let y = [];
    for (let i = 0; i < L.length; i++) {
        let s = 0;
        for (let j = 0; j < i; j++)
            s += L[i][j] * y[j];
        y[i] = (b[i] - s) / L[i][i]
    }
    return y
}
function back(U, y) {
    let n = U.length
      , x = Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let s = 0;
        for (let j = i + 1; j < n; j++)
            s += U[i][j] * x[j];
        if (Math.abs(U[i][i]) < 1e-12)
            throw Error('Sistema singular.');
        x[i] = (y[i] - s) / U[i][i]
    }
    return x
}
function mat(M) {
    return `<table class='mtable'>${M.map(r => `<tr>${r.map(v => `<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</table>`
}
function vec(v, name) {
    return `<div class='result'>${v.map( (z, i) => `${name}<sub>${i + 1}</sub> = ${fmt(z)}`).join('<br>')}</div>`
}
function render(A, b, target, title='Resultado') {
    try {
        const d = lu(A)
          , y = forward(d.L, b)
          , x = back(d.U, y);
        target.innerHTML = `<div class='out-grid'><div class='panel'><h3>Matriz A</h3>${mat(A)}</div><div class='panel'><h3>Matriz L</h3>${mat(d.L)}</div><div class='panel'><h3>Matriz U</h3>${mat(d.U)}</div><div class='panel'><h3>Sustitución hacia adelante: Ly=b</h3>${vec(y, 'y')}</div><div class='panel'><h3>${title}: Ux=y</h3>${vec(x, 'x')}</div><div class='panel'><h3>Pasos de Doolittle</h3>${d.steps.map(s => `<div class='step'>${s}</div>`).join('')}</div></div>`;
        return d
    } catch (e) {
        target.innerHTML = `<div class='error'>${e.message}</div>`
    }
}

function renderGuide() {
    const A = [[4, 2, 1], [12, 10, 5], [-8, 8, 7]]
      , vectors = [[14, 46, 26], [20, 62, 30]]
      , d = lu(A);
    const scenarios = vectors.map(b => {
        const y = forward(d.L, b)
          , x = back(d.U, y)
          , check = A.map(row => row.reduce( (sum, v, j) => sum + v * x[j], 0));
        return {
            b,
            y,
            x,
            check
        }
    }
    );
    const chips = (values, name) => '<div class="solution-values">' + values.map( (v, i) => '<div><span>' + name + '<sub>' + (i + 1) + '</sub></span><strong>' + fmt(v) + '</strong></div>').join('') + '</div>';
    const matrixCard = (name, M, label) => '<div class="factor-card"><div class="factor-label"><strong>' + name + '</strong><span>' + label + '</span></div><div class="bracket-matrix">' + mat(M) + '</div></div>';
    $('#guideOut').innerHTML = '<div class="guide-summary"><span><i>✓</i> Solución calculada</span><span><strong>3 × 3</strong> Matriz del sistema</span><span><strong>2</strong> Vectores independientes</span><span><strong>1</strong> Factorización compartida</span></div>' + '<div class="guide-section-heading"><span>01</span><div><h2>Descomposición de la matriz</h2><p>Los mismos factores L y U se utilizan en ambos escenarios.</p></div></div>' + '<div class="factorization">' + matrixCard('A', A, 'Matriz original') + '<span class="math-operator">=</span>' + matrixCard('L', d.L, 'Triangular inferior') + '<span class="math-operator">×</span>' + matrixCard('U', d.U, 'Triangular superior') + '</div>' + '<div class="guide-section-heading"><span>02</span><div><h2>Solución de cada escenario</h2><p>Primero Ly = b; después Ux = y.</p></div></div>' + '<div class="scenario-grid">' + scenarios.map( (s, i) => '<article class="scenario-card"><header><div><p class="eyebrow">ESCENARIO 0' + (i + 1) + '</p><h3>Vector b<sub>' + (i + 1) + '</sub></h3></div><span class="scenario-vector">(' + s.b.join(', ') + ')ᵀ</span></header><div class="scenario-body"><div class="stage-label"><span>1</span> Sustitución hacia adelante <code>Ly = b</code></div>' + chips(s.y, 'y') + '<div class="stage-label"><span>2</span> Sustitución hacia atrás <code>Ux = y</code></div><div class="final-solution">' + chips(s.x, 'x') + '</div><div class="verification"><strong>✓ Comprobación: Ax = b</strong><span>Ax = (' + s.check.map(fmt).join(', ') + ')ᵀ</span></div></div></article>').join('') + '</div>' + '<div class="guide-section-heading"><span>03</span><div><h2>Procedimiento de Doolittle</h2><p>Construcción de los factores, en orden de cálculo. La diagonal de L es igual a 1.</p></div></div>' + '<div class="calculation-grid">' + [0, 1, 2].map(i => '<section class="calculation-card"><span class="iteration">ITERACIÓN 0' + (i + 1) + '</span><h3>Pivote U<sub>' + (i + 1) + (i + 1) + '</sub> = ' + fmt(d.U[i][i]) + '</h3>' + d.steps.filter(s => s.startsWith('U' + (i + 1)) || s.startsWith('L') && s.charAt(2) === String(i + 1)).map(s => '<div class="step">' + s + '</div>').join('') + '</section>').join('') + '</div>' + '<div class="guide-takeaway"><span>↳</span><div><strong>La ventaja de factorizar</strong><p>Cuando cambia b, conserva L y U. Solo repite las dos sustituciones para obtener la nueva solución.</p></div><span class="takeaway-formula">A = LU</span></div>';
}
function generate() {
    const n = +$(`#n`).value
      , limit = +$(`#limit`).value;
    if (!Number.isInteger(n) || !Number.isInteger(limit) || n < 1 || n > 30 || limit < 1 || limit > 30 || n > limit) {
        $('#editor').dataset.size = '';
        $('#editor').innerHTML = `<div class='error'>Usa valores enteros de 1 a 30. El número de variables no debe superar el límite.</div>`;
        return
    }
    $('#editor').dataset.size = String(n);
    $('#customOut').innerHTML = "<div class='empty-state'><h3>Sistema listo para resolver</h3><p>Completa la matriz A y el vector b a la derecha.</p></div>";
    let h = `<p>Ingresa los coeficientes de A y el vector b:</p><div class='matrix'>`;
    for (let i = 0; i < n; i++) {
        h += `<div class='matrix-row'>`;
        for (let j = 0; j < n; j++)
            h += `<input type='number' step='any' aria-label='Coeficiente A, fila ${i + 1}, columna ${j + 1}' data-a='${i},${j}' value='${i === j ? 1 : 0}'>`;
        h += `<span>=</span><input type='number' step='any' aria-label='Vector b, fila ${i + 1}' data-b='${i}' value='0'></div>`
    }
    $('#editor').innerHTML = h + '</div>'
}
$('#generate').onclick = generate;
$('#example').onclick = () => {
    $('#n').value = 3;
    if (+$('#limit').value < 3 || +$('#limit').value > 30)
        $('#limit').value = 10;
    generate();
    const A = [[4, 2, 1], [12, 10, 5], [-8, 8, 7]]
      , b = [14, 46, 26];
    document.querySelectorAll('[data-a]').forEach(el => {
        let[i,j] = el.dataset.a.split(',').map(Number);
        el.value = A[i][j]
    }
    );
    document.querySelectorAll('[data-b]').forEach(el => el.value = b[+el.dataset.b])
}
;

$('#solve').onclick = () => {
    const n = Number($('#n').value)
      , limit = Number($('#limit').value)
      , out = $('#customOut');
    const error = message => {
        out.innerHTML = '<div class="error">' + message + '</div>'
    }
    ;
    if (!Number.isInteger(n) || !Number.isInteger(limit) || n < 1 || n > 30 || limit < 1 || limit > 30 || n > limit)
        return error('Usa valores enteros de 1 a 30 y respeta el límite configurado.');
    if (Number($('#editor').dataset.size) !== n)
        return error('El tamaño cambió. Pulsa «Generar sistema» para actualizar la matriz.');
    const entries = [...document.querySelectorAll('[data-a], [data-b]')];
    if (entries.some(el => el.value.trim() === '' || !Number.isFinite(Number(el.value))))
        return error('Completa todos los campos con números válidos.');
    const A = Array.from({
        length: n
    }, () => Array(n).fill(0))
      , b = Array(n).fill(0);
    document.querySelectorAll('[data-a]').forEach(el => {
        const [i,j] = el.dataset.a.split(',').map(Number);
        A[i][j] = Number(el.value)
    }
    );
    document.querySelectorAll('[data-b]').forEach(el => b[Number(el.dataset.b)] = Number(el.value));
    render(A, b, out, 'Solución');
}
;
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-page]').forEach(page => page.hidden = page.dataset.page !== button.dataset.view);
    document.querySelectorAll('[data-view]').forEach(item => {
        item.classList.toggle('active', item === button);
        if (item === button)
            item.setAttribute('aria-current', 'page');
        else
            item.removeAttribute('aria-current')
    }
    );
    $('#pageName').textContent = button.textContent.trim().replace(/^[▦▤ƒ]\s*/, '');
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
));
document.querySelector('#editor').addEventListener('input', () => {
    $('#customOut').innerHTML = '<div class="empty-state"><h3>Datos actualizados</h3><p>Pulsa «Resolver sistema» para recalcular los resultados.</p></div>'
}
);
generate();

renderGuide();