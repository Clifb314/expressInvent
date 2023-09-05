const clickLot = () => {
    const lotDiv = document.getElementById('lots')
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('required', 'true')
    input.setAttribute('name', 'lots')
    lotDiv.appendChild(input)
}

const removeLot = () => {
    const lotDiv = document.getElementById('lots')
    if (lotDiv.childNodes.length > 2) {
        lotDiv.removeChild(lotDiv.lastChild)
    }
}

const clickManu = () => {
    const manuDiv = document.getElementById('manufact')
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('required', 'true')
    input.setAttribute('name', 'manufact')
    manuDiv.appendChild(input)
}

const removeManu = () => {
    const manuDiv = document.getElementById('manufact')
    if (manuDiv.childNodes.length > 2) {
        manuDiv.removeChild(manuDiv.lastChild)
    }
}


const manuBtn = document.getElementById('manuAdd')
const lotBtn = document.getElementById('lotAdd')
const manuRemove = document.getElementById('manuRemove')
const lotRemove = document.getElementById('lotRemove')

manuBtn.addEventListener('click', clickManu)
lotBtn.addEventListener('click', clickLot)
manuRemove.addEventListener('click', removeManu)
lotRemove.addEventListener('click', removeLot)