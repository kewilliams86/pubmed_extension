function searchFunction(term, callback) {

    //console.log(term)
    var xhttp = new XMLHttpRequest();

    xhttp.onload = function() {

        // only generate phrases if request succeeds
        // if valid acronym, www.path.to/json/ACRONYM will exist
        try {
            if (this.readyState == 4 && this.status == 200) {
                query = JSON.parse(this.responseText);
                // get array of objects containing acronym, phrase, count, and MeSH ID
                let phraseList = query.map(function (element) { return element });
                results.push(phraseList); // make multidimensional array, index for each found acronym
            }
        } catch (err) { // ??? if word not acronym, not sure how to handle this as error occasionally occurred without
            console.log(term + ' not found');
        } finally {
            callback(); // call generateDialogBox
        }
    }

    //xhttp.open("GET", 'https://my-json-server.typicode.com/kewilliams86/demo/' + term, true);
    xhttp.open("GET", 'https://bioinformatics.easternct.edu/BCBET2/findphrase.php?q=' + term, true);
    xhttp.send();
}

function generateDialogBox() {
    waiting--; // wait for all pages to load
    if (waiting == 0) {

        //console.log(results)
        if (results.length > 0) { // if any matches found

            dialogData = '<dialog id = "dialogAcronymExt">';

            dialogData += '<label style="margin-top: 0px; margin-bottom: 8px; margin-right: 50px;">Potential acronyms were detected: </label>';

            for (let t of results) {
                t = t.sort(function (a, b) {
                    return b.count - a.count;
                })

                //console.log(results)
                console.log(t)
                //console.log(typeOf(t[0].acronym))

                dialogData += '<button class="accordion">' + t[0].acronym + '</button>';
                dialogData += '<div class="panel" style="display: none;">'

                for (let r of t) {
                    //console.log(r);
                    dialogData += '<label for="' + r.meshID + '">';
                    dialogData += '<input type="checkbox" class = "selections" meshID = "' + r.meshID;
                    dialogData += '" acronym="' + r.acronym + '" phrase="' + r.phrase + '"/>';
                    dialogData += '<span>' + r.phrase.toUpperCase() + ' (' + r.count + ')</span></label>';
                }
                dialogData += '</div>'
            }

            //console.table(results);

            dialogData += '</ol>';
            dialogData += '<label style="margin-top: 15px; margin-bottom: 10px;">Click acronym and select term</label>';
            dialogData += '<button id = "dialogClose">Close</button>';
            dialogData += '<button id = "dialogSearch">Search</button></dialog>';

            document.body.innerHTML += dialogData;

            var dialog = document.getElementById("dialogAcronymExt");

            let acc = dialog.querySelectorAll("[class = 'accordion']");

            //iterate through accordian buttons add event listener to show/unshow elements
            for (let i = 0; i < acc.length; i++) {
                acc[i].addEventListener("click", function () {
                    this.classList.toggle("active");
                    var panel = this.nextElementSibling;
                    if (panel.style.display === "block") {
                        panel.style.display = "none";
                    } else {
                        panel.style.display = "block";
                    }
                });
            }

            dialog.querySelector("button[id = 'dialogSearch']").addEventListener("click", function () {
                var phraseSelected = false;
                let checkboxes = dialog.getElementsByClassName('selections');

                for (let c of checkboxes) {
                    if (c.checked == true) {
                        phraseSelected = true;
                        let acronym = c.getAttribute('acronym');
                        let phrase = c.getAttribute('phrase');
                        let meshID = c.getAttribute('meshid');

                        if (searchTermList.length == 1) { //single word search no need encapsulation of MeSH term in parentheses
                            if (meshID.startsWith('D')) {
                                searchTerm = searchTerm.replace(acronym, phrase + '[MeSH Terms]');
                            } else if (meshID.startsWith('C')) {
                                searchTerm = searchTerm.replace(acronym, phrase + '[Supplementary Concept]');
                            }
                        } else {
                            if (meshID.startsWith('D')) {
                                searchTerm = searchTerm.replace(acronym, '(' + phrase + '[MeSH Terms])');
                            } else if (meshID.startsWith('C')) {
                                searchTerm = searchTerm.replace(acronym, '(' + phrase + '[Supplementary Concept])');
                            }
                        }

                    }
                }

                if (phraseSelected) {
                    console.log(searchTerm);
                    window.location.href = 'https://pubmed.ncbi.nlm.nih.gov/?term=' + searchTerm;
                } else {
                    //notFound = 'No phrase selected';
                    //document.getElementById('notFound').innerHTML = notFound.fontcolor('red');
                    document.getElementById('notFound').innerHTML = 'No Phrase Selected'
                    //alert('no items selected');
                    //console.log('no items selected');
                }
            })

            dialog.querySelector("button[id = 'dialogClose']").addEventListener("click", function () {
                dialog.close();
            })

            dialog.style.top = '-300px';
            dialog.showModal();
            window.localStorage.setItem('acronymDetector', 'skip');
        }
    }
}

var results = [];
var searchTerm = document.getElementById('id_term').value.toUpperCase() // get search term
var searchTermList = searchTerm.replace(/[/()'"]/g, '').split(' ');

var waiting = searchTermList.length // get number of words to track when all executions of searchFunction() complete

//console.log(searchTermList);
//loop through all words, find matches and execute finish
if (localStorage.getItem('acronymDetector') === null) {
    searchTermList.forEach(function (term) {
        searchFunction(term, generateDialogBox);
    })
} else {
    window.localStorage.removeItem('acronymDetector');
}
