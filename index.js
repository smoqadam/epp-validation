
const MANUSCRIPT_URL = 'https://raw.githubusercontent.com/elifesciences/enhanced-preprints-client/master/manuscripts.json';
const STAGING_URL = 'https://staging--epp.elifesciences.org/reviewed-preprints';

function loadJson(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        });
}

function checkManuscriptStatus(id) {
    const endpoints = ['', '/figures', '/reviews'].map(subpath => 
        fetch(`${STAGING_URL}/${id}${subpath}`)
            .then(res => res.status)
            .catch(() => null)
    );

    return Promise.all(endpoints).then(statuses => ({
        id,
        prod: statuses[0],
        figures: statuses[1],
        reviews: statuses[2],
    }));
}

function main() {
    loadJson(MANUSCRIPT_URL)
        .then(jsonData => {
            const manuscripts = jsonData['manuscripts'];
            const manuscriptIds = Object.keys(manuscripts);
            
            return Promise.all(manuscriptIds.filter(key => /v/.test(key)).map(key => {
                console.log(`Checking manuscript ID: ${key}`);
                return checkManuscriptStatus(key);
            }));
        })
        .then(results => {
            const idsWithIssues = results.filter(({ prod, figures, reviews }) => prod !== 200 || figures !== 200 || reviews !== 200);
            
            if (idsWithIssues.length > 0) {
                console.log('Some manuscripts have issues:', idsWithIssues);
            } else {
                console.log('All manuscripts are okay!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

main();
