var tableNumber = null;


AFRAME.registerComponent("markerhandler", {
  init: async function() {

    if (tableNumber === null) {
      this.askTableNumber();
    }

    var dishes = await this.getDishes();

    this.el.addEventListener("markerFound", () => {
      if(tableNumber !== null){
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });

    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askTableNumber: function() {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    
    swal({
      title: '¡Bienvenido a "El Antojo"',
      icon: iconUrl,
      content: {
        element: "input",
        attributes:{
          placeholder: "Escribe el número de tu mesa",
          type: "number",
          min: 1
        }
      },
      closeOnClickOutside: false
    }).then(inputValue =>{
      tableNumber = inputValue

    })
    
    
  },

  handleMarkerFound: function(dishes, markerId) {
    // Obtener el día
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();
    
    // De domingo a sábado: 0 - 6
    var days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];

    var dish = dishes.filter(dish => dish.id === markerId)[0];

    if (!dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.dish_name.toUpperCase(),
        text: "¡Este platillo no está disponible hoy! (Nos encontramos usando el horario de México)",
        timer: 2500,
        buttons: false
      });
    } else {
       // Cambiar el tamaño del modelo a su escala inicial
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);
      model.setAttribute("scale", dish.model_geometry.scale);
      
      //Actualizar el contenido UI de VISIBILIDAD de la escena AR (MODELO, INGREDIENTES Y PRECIO) 
      model.setAttribute("visible", true);

      var ingredientesContainer = document.querySelector(`#main-plane-${dish.id}`);
      ingredientesContainer.setAttribute("visible", true)

      var pricePlane = document.querySelector(`#price-plane-${dish.id}`);
      pricePlane.setAttribute("visible", true)
      /* REEMPLAZAR COMENTARIOS Y AÑADIR AQUÍ EL CÓDIGO
      
    
      
      
      */

      // Cambiar la visibilidad del botón div
      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";

      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");


      // Usar eventos de clic
      ratingButton.addEventListener("click", function() {
        swal({
          icon: "warning",
          title: "Calificar platillo",
          text: "Procesando calificación"
        });
      });

      orderButtton.addEventListener("click", () => {
        var tNumber;
        tableNumber <= 9 ? (tNumber = `T0${tableNumber}`) : `T${tableNumber}`
        this.handleOrder(tNumber, dish);

        swal({
          icon: "https://i.imgur.com/4NZ6uLY.jpg",
          title: "¡Gracias por tu orden!",
          text: "¡Recibirás tu orden pronto!",
          timer: 2000,
          buttons: false
        });
      });
    }
  },
  handleOrder: function(tNumber, dish) {
    firebase.firestore()
    .collection("tables")
    .doc(tNumber)
    .get()
    .then(doc => {
      var details = doc.data()
      if(details["current_orders"][dish.id]){
        //incremetar la cantidad actual
        details["current_orders"][dish.id]["quantity"] +=1

        //calcular el subtotal de un elemento
        var currentQuantity = details["current_orders"][dish.id]["quantity"]
        details["current_orders"][dish.id]["subtotal"] = currentQuantity * dish.price
      }else{
        details["current_orders"][dish.id] = {
          item: dish.dish_name, 
          price: dish.price,
          quantity: 1, 
          subtotal: dish.price * 1
        }
      }
      details.total_bill+= dish.price

      firebase
      .firestore()
      .collection("tables")
      .doc(doc.id)
      .update(details)
    })
  },

  getDishes: async function() {
    return await firebase
      .firestore()
      .collection("dishes")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },
  handleMarkerLost: function() {
    // Cambiar la visibilidad del botón div
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});