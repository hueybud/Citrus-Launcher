var navBarIndex = `
    <nav class="navbar navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
    <a class="navbar-brand"><img src='./assets/citrus logo.png' width='64px' height='64px'></a>
    <form class="d-flex">
        <span class="me-3" id="refreshIconOuter"><i class="fa-solid fa-arrows-rotate fa-2x" id="refreshIcon"></i>></span>
        <span class="me-3" id="homeIconOuter"><i class="fa-solid fa-house fa-2x" id="homeIcon"></i></span>
        <span id="settingsIconOuter"><i class="fa-solid fa-gear fa-2x" id="settingsIcon"></i></span>
    </form>
    </div>
    </nav>
`

var navBar = `
    <nav class="navbar navbar-dark bg-dark fixed-top">
    <div class="container-fluid">
    <a class="navbar-brand"><img src='./assets/citrus logo.png' width='64px' height='64px'></a>
    <form class="d-flex">
        <span class="me-3" id="homeIconOuter"><i class="fa-solid fa-house fa-2x" id="homeIcon"></i></span>
        <span id="settingsIconOuter"><i class="fa-solid fa-gear fa-2x" id="settingsIcon"></i></span>
    </form>
    </div>
    </nav>
`
$(document).ready(function(){
    var currentPage = window.location.href.split('/');
    currentPage = currentPage[currentPage.length - 1];
    if (currentPage == "index.html") {
        $('body').prepend(navBarIndex)
    } else {
        $('body').prepend(navBar)
    }
    $("body").css({'padding-top': $('nav.navbar').height() + 15});
    $('#homeIconOuter').click(function(){
        if (currentPage != "index.html") {
            window.location.href = "index.html";
        }
    })
    $('#settingsIconOuter').click(function(){
        if (currentPage != "settings.html") {
            window.location.href = "settings.html";
        }
    })
})