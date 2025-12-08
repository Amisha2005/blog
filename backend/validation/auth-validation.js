const {z} = require('zod');
const loginSchema = z.object({
   email : z
    .string({required_error:"email is require"})
    .trim()
    // .email({message:'Invalid email address'})
    .min(3,{msg:"email must be at least 3 character."})
    .max(255,{msg:"name should be not greater than 255 character."}),
      password : z
    .string({required_error:"password is require"})
    .min(7,{msg:"password must be at least 7 character."})
    .max(255,{msg:"password should be not greater than 255 character."}),
});
//creating object schema
const signupSchema = loginSchema.extend({
    username : z
    .string({required_error:"name is require"})
    .trim()
    .min(3,{msg:"name must be at least 3 character."})
    .max(255,{msg:"name should be not greater than 255 character."}),
});
module.exports = {signupSchema,loginSchema};