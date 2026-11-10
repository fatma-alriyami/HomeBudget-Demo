using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FamilyMembersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FamilyMembersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<FamilyMember>>> GetAll()
        {
            var members = await _context.FamilyMembers
                .AsNoTracking()
                .OrderBy(m => m.FullName)
                .ToListAsync();

            return Ok(members);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<FamilyMember>> GetById(int id)
        {
            var member = await _context.FamilyMembers
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.Id == id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Family member not found."
                });
            }

            return Ok(member);
        }

        [HttpPost]
        public async Task<ActionResult<FamilyMember>> Create(
            FamilyMemberCreateDto dto)
        {
            var member = new FamilyMember
            {
                FullName = dto.FullName.Trim(),
                Relationship = dto.Relationship.Trim()
            };

            _context.FamilyMembers.Add(member);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = member.Id },
                member);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            FamilyMemberUpdateDto dto)
        {
            var member = await _context.FamilyMembers.FindAsync(id);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Family member not found."
                });
            }

            member.FullName = dto.FullName.Trim();
            member.Relationship = dto.Relationship.Trim();
            member.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}