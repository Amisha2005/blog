const {z} = require('zod');
const loginSchema = z.object({
   email : z
    .string({required_error:"email is require"})
    .trim()
    .email({message:"Please enter a valid email address."})
    .min(3,{message:"Email must be at least 3 characters."})
    .max(255,{message:"Email must not be greater than 255 characters."}),
      password : z
    .string({required_error:"password is require"})
    .min(7,{message:"Password must be at least 7 characters."})
    .max(255,{message:"Password must not be greater than 255 characters."}),
});
//creating object schema
const signupSchema = loginSchema.extend({
    username : z
    .string({required_error:"name is require"})
    .trim()
    .min(3,{message:"Name must be at least 3 characters."})
    .max(255,{message:"Name must not be greater than 255 characters."}),
});
module.exports = {signupSchema,loginSchema};
