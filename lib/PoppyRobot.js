class PoppyRobot{
    
    get motors() { return this._motors; }
    
    constructor(baseURL = "http://localhost:8080", timeout = 100000){
        this.axiosClient = axios.create({
          baseURL: baseURL,
          timeout: timeout,
          headers: {
              "Content-Type": "application/json"
          }
        });
        this._motors = new Map();
    }
    
    connect(){
      let that = this;
      return this.axiosClient.get('/', {"transformResponse": function(data){
                // construct the methods to access and control motors
                data = data.replace("Infinity","\"Infinity\"");
                JSON.parse(data).motors.forEach(function(motor){
                    that[motor.name] = new PoppyMotor(motor.name);
                    
                    // TODO : change to "that._motors" ?
                    that.motors.set(motor.name, that[motor.name]);
                    motor.registers.forEach(function(register){
                        if(register != "name") {
                            that[motor.name][register] = new PoppyRegister(that.axiosClient, motor.name, register, motor[register]);
                        }
                    });
                });
                return data;
              } });
    }
    
    get(...registers){
        return Promise.all(registers.map(register => register.get()));
    }
    
    set(...registerValueMap){
        return Promise.all(registerValueMap.map(kv => kv[0].set(kv[1])));
    }
    
    setAll(registerName, value){
        return Array.from(this._motors).map( ([name, motor]) => 
          motor[registerName].set(value)
        );
    }
    
    getAll(registerName){
        return Array.from(this._motors).map( ([name, motor]) => 
          motor[registerName].get()
        );
    }


}

class PoppyMotor {
    constructor(name){
        this.name = name;
    }
}

class PoppyRegister {
    
    constructor(axiosClient, motorName, name, currentValue){
        this.axiosClient = axiosClient;
        this.motorName = motorName;
        this.name = name;
        this.currentValue = currentValue;
    }
    
    set(newValue){
        return this.axiosClient.post("/motor/"+this.motorName+"/register/"+this.name+"/value.json", newValue);
    }
    
    get(){
        let that = this;
        return this.axiosClient.get("/motor/"+this.motorName+"/register/"+this.name, 
            {"transformResponse": function(data){
                  that.currentValue = JSON.parse(data)[that.name];
                  return that.currentValue;
                 } 
            }
         );
    }
}

export {
    PoppyRobot,
    PoppyMotor,
    PoppyRegister
}